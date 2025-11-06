# YouTube MCP Server

YouTube Data API v3 を使用した MCP (Model Context Protocol) サーバーです。

## 機能

### 動画関連

- `get_video` - YouTube動画の詳細情報を取得
- `search_videos` - YouTube動画を検索

### チャンネル関連

- `get_channel` - チャンネル情報を取得
- `get_channel_videos` - チャンネルの動画一覧を取得

### プレイリスト関連

- `get_playlist` - プレイリスト情報を取得
- `get_playlist_items` - プレイリスト内の動画一覧を取得

### コメント関連

- `get_comment_threads` - 動画のコメントスレッドを取得（ページネーション対応）
- `get_comment_replies` - コメントへの返信を取得（ページネーション対応）

### 字幕関連

- `get_transcript_metadata` - 動画で利用可能な字幕のメタデータを取得（言語、種類、更新日時など）
- `get_transcript` - 動画の字幕を取得（要: yt-dlp）

## 前提条件

- YouTube Data API v3のAPIキー
- yt-dlp（`get_transcript`機能を使用する場合）
  - インストール方法: https://github.com/yt-dlp/yt-dlp/wiki/Installation
    - macOS: `brew install yt-dlp`
    - Windows: `winget install yt-dlp`

## セットアップ

### 1. YouTube Data API v3 キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「ライブラリ」から「YouTube Data API v3」を有効化
4. 「APIとサービス」→「認証情報」からAPIキーを作成

### 2. ビルド

```bash
pnpm clean
pnpm install
pnpm build
```

## 使用方法

```json
{
  "mcpServers": {
    "youtube-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "YOUTUBE_API_KEY": "${YOUTUBE_API_KEY}"
      }
    }
  }
}
```

環境変数を設定してエディタを再起動すると、YouTube MCPツールが利用可能になります。

## ディレクトリ構成(src/)

```
src/
├── index.ts        # エントリポイント
├── api/            # YouTube API
├── lib/            # 外部ライブラリ連携
├── mcp/            # MCPプロトコル実装
│   └── tools/      # ツール定義
└── __tests__/      # テスト
```

## 制限事項

- YouTube Data API v3 のクォータ制限があります（デフォルト: 10,000ユニット/日）
- APIキーは適切に管理し、公開しないよう注意してください

## テストコーディング規約

### neverthrow Result型の検証パターン

```typescript
import { err, ok } from "neverthrow";

// ✅ 成功ケースの検証
expect(result.isOk()).toBe(true);
expect(result.isErr()).toBe(false);
expect(result._unsafeUnwrap()).toStrictEqual(expectedData);

// ✅ エラーケースの検証
expect(result.isOk()).toBe(false);
expect(result.isErr()).toBe(true);
expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("error message"));
```

### MCPツールテストのパターン

```typescript
// 成功レスポンスの検証
test("正常系: データを取得して正しいレスポンスを返す", async () => {
  mockGetVideo.mockResolvedValueOnce(ok(mockVideoData));

  const result = await handleVideoTool(
    YOU_TUBE_TOOL_NAMES.GET_VIDEO,
    { videoId: "test-id" },
    mockApiKey,
  );

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toStrictEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(mockVideoData),
        },
      ],
    } satisfies CallToolResult);
  }
});

// API呼び出し失敗の検証
test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
  mockGetVideo.mockResolvedValueOnce(err(new Error("API Error")));

  const result = await handleVideoTool(
    YOU_TUBE_TOOL_NAMES.GET_VIDEO,
    { videoId: "test-id" },
    mockApiKey,
  );

  expect(result.isOk()).toBe(false);
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("API Error"));
});
```

### エラー検証の使い分け

```typescript
// 具体的なエラーメッセージの検証
expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Channel not found"));

// エラーの型のみ検証（メッセージは問わない）
expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));

// カスタムエラークラスの検証
expect(result._unsafeUnwrapErr()).toBeInstanceOf(TranscriptError);
```

### モック関数の戻り値設定

```typescript
// 成功ケース
mockFunction.mockResolvedValueOnce(ok(data));

// エラーケース
mockFunction.mockResolvedValueOnce(err(new Error("error")));

// 例外をスロー
mockFunction.mockRejectedValueOnce(new Error("exception"));
```
