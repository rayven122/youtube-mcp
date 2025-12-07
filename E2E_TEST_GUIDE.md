# YouTube MCP Server E2Eテストガイド

## 重要な注意事項

**このE2Eテストは、MCPツール（youtube-mcp）を直接使用して実行します。**

- e2e-test-runnerエージェントは使用しません
- `/mcp`コマンドで表示されるyoutube-mcpツールを直接呼び出してテストを実行してください
- 各テストケースは実際のYouTube APIを呼び出すため、APIキーが必要です

## テスト実行方法

### モード1: Stdioモード（MCP経由）

1. **事前チェック**:
   - `.mcp.json`にyoutube-mcpの設定があることを確認
   - APIキーが正しく設定されていることを確認
   - ツールが利用可能か確認（利用できない場合は設定を見直し）

2. **テスト実行**:
   - 各テストケースのツールを直接呼び出す
   - ツール名の形式: `mcp__youtube-mcp__<tool_name>`
   - 例: `mcp__youtube-mcp__get_comment_threads`

3. **結果検証**:
   - レスポンスを確認し、期待値と比較
   - エラーの場合はエラーメッセージを確認

### モード2: HTTPモード（localhost）

localhostでHTTPサーバーを立ち上げて、curlやHTTPクライアントでテストする方法です。

#### 1. サーバー起動

```bash
# ビルド
pnpm build

# HTTPモードでサーバー起動
TRANSPORT_MODE=http YOUTUBE_API_KEY=your_api_key HTTP_PORT=8080 node dist/index.js
```

成功すると以下のようなメッセージが表示されます：
```
YouTube MCP Server (Streamable HTTP) started on port 8080
Endpoint: http://localhost:8080/mcp
Health check: http://localhost:8080/health
```

#### 2. ヘルスチェック

```bash
curl http://localhost:8080/health
```

期待される結果：
```json
{"status":"ok","server":"youtube-mcp-server","version":"1.0.0"}
```

#### 3. ツール一覧の取得

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-YouTube-API-Key: your_api_key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**重要な注意点**：
- `Accept`ヘッダーには `application/json` を含める必要があります
- `X-YouTube-API-Key`ヘッダーでAPIキーを渡す（省略時は環境変数`YOUTUBE_API_KEY`が使用されます）

#### 4. ツールの実行例

##### 動画情報の取得（get_video）

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-YouTube-API-Key: your_api_key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_video",
      "arguments": {
        "videoId": "dQw4w9WgXcQ"
      }
    }
  }'
```

##### 動画検索（search_videos）

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-YouTube-API-Key: your_api_key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "search_videos",
      "arguments": {
        "query": "TypeScript tutorial",
        "maxResults": 5
      }
    }
  }'
```

##### コメント取得（get_comment_threads）

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-YouTube-API-Key: your_api_key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "get_comment_threads",
      "arguments": {
        "videoId": "dQw4w9WgXcQ",
        "maxResults": 10,
        "order": "relevance"
      }
    }
  }'
```

#### 5. レスポンス形式

レスポンスは標準的なJSON形式で返されます：

```json
{"jsonrpc":"2.0","result":{...},"id":1}
```

jqで整形する場合：
```bash
curl ... | jq .
```

#### 6. HTTPモードのメリット

- **Stateless**: 各リクエストが独立して処理される
- **水平スケーリング可能**: 複数インスタンスを起動できる
- **API統合が容易**: 任意のHTTPクライアントから呼び出し可能
- **リクエストごとのAPIキー**: ヘッダーで異なるAPIキーを使い分け可能
- **デバッグしやすい**: curlで直接テスト可能

### トラブルシューティング

#### Stdioモード

- **ツールが見つからない場合**:
  - `.mcp.json`の設定を確認
  - エディタを再起動
  - `pnpm build`でビルドを実行

- **APIエラーが発生する場合**:
  - APIキーの有効性を確認
  - APIクォータの残量を確認
  - YouTube APIコンソールでキーの制限を確認

#### HTTPモード

- **サーバーが起動しない場合**:
  - ポートが既に使用されていないか確認: `netstat -ano | findstr :8080` (Windows) / `lsof -i :8080` (Mac/Linux)
  - `TRANSPORT_MODE=http`が正しく設定されているか確認
  - ビルドが完了しているか確認: `pnpm build`

- **"Not Acceptable" エラーが返る場合**:
  - `Accept`ヘッダーに `application/json` が含まれているか確認
  - curlコマンドのヘッダー部分を見直す

- **"API key not valid" エラーが返る場合**:
  - `X-YouTube-API-Key`ヘッダーが正しく設定されているか確認
  - 環境変数`YOUTUBE_API_KEY`が設定されているか確認（ヘッダー省略時）
  - APIキーの有効性をYouTube APIコンソールで確認

- **接続できない場合**:
  - サーバーが起動しているか確認
  - ファイアウォールの設定を確認
  - `curl http://localhost:8080/health`でヘルスチェックを試す

## 前提条件

### 必須: .mcp.jsonの設定

#### Stdioモード用設定

`.mcp.json`に以下の設定が必要です：

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

#### HTTPモード用設定（オプション）

HTTPサーバーとして動作させる場合：

```json
{
  "mcpServers": {
    "youtube-mcp-http": {
      "type": "stdio",
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "TRANSPORT_MODE": "http",
        "HTTP_PORT": "8080",
        "YOUTUBE_API_KEY": "${YOUTUBE_API_KEY}"
      }
    }
  }
}
```

**重要**:

- `YOUTUBE_API_KEY`には有効なYouTube Data API v3のキーを設定してください
- APIキーが設定されていない、または無効な場合はテストが実行できません
- ビルド済み（`pnpm build`実行済み）であることを確認してください
- HTTPモードの場合、`TRANSPORT_MODE=http`を設定する必要があります

### 設定確認手順

1. `.mcp.json`にyoutube-mcpエントリがあることを確認
2. APIキーが正しく設定されていることを確認
3. `./dist/index.js`が存在することを確認（なければ`pnpm build`を実行）
4. エディタを再起動してMCPサーバーを再接続

## 1. 動画関連ツール (Video Tools)

### get_video

```yaml
テストケース1: 通常の動画ID
  入力: videoId: "dQw4w9WgXcQ"
  期待: 動画タイトル、説明、再生回数、チャンネル情報が取得できる

テストケース2: 複数パーツ指定
  入力:
    videoId: "dQw4w9WgXcQ"
    parts: ["snippet", "statistics", "contentDetails"]
  期待: 指定した全パーツの情報が取得できる

テストケース3: 無効な動画ID
  入力: videoId: "invalid_id_12345"
  期待: エラーメッセージ「Video not found」

テストケース4: 削除された動画
  入力: videoId: "deleted_video_id"
  期待: エラーメッセージまたは空の結果

テストケース5: プライベート動画
  入力: videoId: "private_video_id"
  期待: 制限された情報のみ取得
```

### search_videos

```yaml
テストケース1: 基本検索
  入力: query: "TypeScript tutorial"
  期待: 関連動画リストが取得できる（デフォルト10件）

テストケース2: 最大件数指定
  入力:
    query: "React hooks"
    maxResults: 50
  期待: 50件の検索結果

テストケース3: ソート順指定
  入力:
    query: "JavaScript"
    order: "viewCount"
  期待: 再生回数順でソートされた結果

テストケース4: チャンネル検索
  入力:
    query: "Google"
    type: "channel"
  期待: チャンネル一覧が返される

テストケース5: 空のクエリ
  入力: query: ""
  期待: エラーまたは一般的な結果

テストケース6: 特殊文字を含むクエリ
  入力: query: "日本語 & English #hashtag"
  期待: 正常に検索できる

テストケース7: 結果が0件
  入力: query: "zxcvbnmasdfghjklqwertyuiop12345"
  期待: 空の結果配列
```

## 2. チャンネル関連ツール (Channel Tools)

### get_channel

```yaml
テストケース1: チャンネルID指定
  入力: channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw"
  期待: Google Developersチャンネル情報

テストケース2: 存在しないチャンネル
  入力: channelId: "UC_invalid_channel_id"
  期待: エラー「Channel not found」

テストケース3: 削除されたチャンネル
  入力: channelId: "deleted_channel_id"
  期待: エラーまたは制限された情報
```

### get_channel_videos

```yaml
テストケース1: 最新動画順
  入力:
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw"
    order: "date"
  期待: 投稿日順の動画リスト

テストケース2: 人気順
  入力:
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw"
    order: "viewCount"
  期待: 再生回数順の動画リスト

テストケース3: 最大件数指定
  入力:
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw"
    maxResults: 5
  期待: 5件の動画

テストケース4: 動画がないチャンネル
  入力: channelId: "no_videos_channel"
  期待: 空の配列

テストケース5: 大量動画のチャンネル
  入力:
    channelId: "prolific_channel"
    maxResults: 50
  期待: 50件取得（ページネーション処理）
```

## 3. プレイリスト関連ツール (Playlist Tools)

### get_playlist

```yaml
テストケース1: 公開プレイリスト
  入力: playlistId: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
  期待: プレイリスト情報（タイトル、説明、動画数）

テストケース2: プライベートプレイリスト
  入力: playlistId: "private_playlist_id"
  期待: アクセス拒否エラー

テストケース3: 削除されたプレイリスト
  入力: playlistId: "deleted_playlist"
  期待: エラー「Playlist not found」

テストケース4: 空のプレイリスト
  入力: playlistId: "empty_playlist"
  期待: 動画数0の情報
```

### get_playlist_items

```yaml
テストケース1: 基本取得
  入力: playlistId: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
  期待: プレイリスト内の動画リスト

テストケース2: 大規模プレイリスト
  入力:
    playlistId: "large_playlist_200videos"
    maxResults: 50
  期待: 最初の50件

テストケース3: 削除された動画を含む
  入力: playlistId: "playlist_with_deleted"
  期待: 削除された動画はスキップまたは表示

テストケース4: プライベート動画を含む
  入力: playlistId: "playlist_with_private"
  期待: プライベート動画の処理

テストケース5: 空のプレイリスト
  入力: playlistId: "empty_playlist"
  期待: 空の配列
```

## 4. コメント関連ツール (Comment Tools)

### get_comment_threads

```yaml
テストケース1: 基本的なコメント取得
  入力: videoId: "dQw4w9WgXcQ"
  期待: 動画のコメントスレッド一覧（デフォルト20件）

テストケース2: ページネーション
  入力:
    videoId: "dQw4w9WgXcQ"
    maxResults: 100
  期待: 最大100件のコメント

テストケース3: 時系列順
  入力:
    videoId: "dQw4w9WgXcQ"
    order: "time"
  期待: 投稿時刻順のコメント

テストケース4: 関連性順
  入力:
    videoId: "dQw4w9WgXcQ"
    order: "relevance"
  期待: 関連性順（いいね数など）のコメント

テストケース5: ページトークン使用
  入力:
    videoId: "dQw4w9WgXcQ"
    pageToken: "次ページトークン"
  期待: 次ページのコメント

テストケース6: コメント無効動画
  入力: videoId: "comments_disabled_video"
  期待: 空の配列またはエラー

テストケース7: 大量コメント動画
  入力:
    videoId: "viral_video_id"
    maxResults: 100
  期待: 100件取得、nextPageTokenあり
```

### get_comment_replies

```yaml
テストケース1: 返信取得
  入力: parentId: "Ugx7mRZlM1pPUfW5pHJ4AaABAg"
  期待: 指定コメントへの返信リスト

テストケース2: 大量返信
  入力:
    parentId: "popular_comment_id"
    maxResults: 100
  期待: 最大100件の返信

テストケース3: 返信なし
  入力: parentId: "no_replies_comment_id"
  期待: 空の配列

テストケース4: 削除されたコメント
  入力: parentId: "deleted_comment_id"
  期待: エラーまたは空の結果

テストケース5: ページネーション
  入力:
    parentId: "many_replies_comment_id"
    pageToken: "次ページトークン"
  期待: 次ページの返信
```

## 5. エラーケース・エッジケース

### APIキー関連

```yaml
テストケース1: APIキー未設定
  環境: YOUTUBE_API_KEY=""
  期待: "YOUTUBE_API_KEY environment variable is required"

テストケース2: 無効なAPIキー
  環境: YOUTUBE_API_KEY="invalid_key"
  期待: "API key not valid"

テストケース3: クォータ超過
  条件: APIクォータを使い切った状態
  期待: "Quota exceeded"エラー
```

### ネットワーク関連

```yaml
テストケース1: タイムアウト
  条件: ネットワーク遅延
  期待: タイムアウトエラー

テストケース2: 接続エラー
  条件: インターネット未接続
  期待: ネットワークエラー
```

### データ検証

```yaml
テストケース1: 不正な入力型
  入力: videoId: 123 (数値)
  期待: 型エラーまたは自動変換

テストケース2: 必須パラメータ欠落
  入力: {} (空オブジェクト)
  期待: バリデーションエラー

テストケース3: 範囲外の値
  入力: maxResults: 100 (上限50)
  期待: 50に制限または警告

テストケース4: 特殊文字エスケープ
  入力: query: "<script>alert('xss')</script>"
  期待: 適切にエスケープされる
```

## 7. パフォーマンステスト

```yaml
並行リクエスト:
  テスト: 同時に10個のツールを実行
  期待: 全て正常に処理される

大量データ処理:
  テスト: 3時間動画のコメント取得
  期待: メモリ使用量が適切、タイムアウトしない

レート制限:
  テスト: 連続100回のAPI呼び出し
  期待: 適切なレート制限処理
```

## 8. 実行手順

### 手動テスト (Stdioモード)

```bash
# 1. 環境変数設定
export YOUTUBE_API_KEY="your-api-key"

# 2. MCPサーバー起動
pnpm start

# 3. 各ツールを順番にテスト
# Claude/Cursorから各テストケースを実行
```

### 手動テスト (HTTPモード)

```bash
# 1. ビルド
pnpm build

# 2. HTTPサーバー起動
TRANSPORT_MODE=http YOUTUBE_API_KEY=your-api-key HTTP_PORT=8080 node dist/index.js

# 3. 別のターミナルでテスト実行
# ヘルスチェック
curl http://localhost:8080/health

# ツール一覧取得
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-YouTube-API-Key: your-api-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 動画情報取得
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-YouTube-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_video",
      "arguments": {"videoId": "dQw4w9WgXcQ"}
    }
  }'
```

### 自動テスト

```bash
# ユニットテスト実行
pnpm test

# カバレッジ付き
pnpm test:coverage
```

## 9. テスト用動画ID・チャンネルID

```yaml
テスト用リソース:
  一般的な動画:
    - dQw4w9WgXcQ (Rick Astley - Never Gonna Give You Up)
    - jNQXAC9IVRw (Me at the zoo - YouTube最初の動画)

  日本語コンテンツ:
    - 任意の日本語コメント付き動画

  チャンネル:
    - UC_x5XG1OV2P6uZZ5FSM9Ttw (Google Developers)
    - UCkQX1tChV7Z7l1LFF4L9j_g (YouTube Creators)

  プレイリスト:
    - PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf (例)
```

## 10. 検証チェックリスト

### 共通

- [ ] 全ツールが正常に呼び出せる
- [ ] 各ツールの必須パラメータが機能する
- [ ] オプションパラメータが正しく処理される
- [ ] エラーケースで適切なメッセージが返る
- [ ] 大量データでメモリリークがない
- [ ] APIクォータ制限が適切に処理される
- [ ] 並行実行で問題が発生しない

### HTTPモード固有

- [ ] ヘルスチェックエンドポイントが動作する
- [ ] HTTPヘッダーでのAPIキー認証が機能する
- [ ] 環境変数のAPIキーフォールバックが機能する
- [ ] 複数の同時リクエストが正しく処理される（stateless動作）
- [ ] リクエストごとにサーバーインスタンスが適切にクリーンアップされる
- [ ] JSON形式のレスポンスが正しく返される
- [ ] 異なるAPIキーで複数リクエストを送信できる

## 11. 字幕メタデータ関連ツール (Transcript Metadata Tools)

### get_transcript_metadata

```yaml
テストケース1: 字幕が利用可能な動画
  入力: videoId: "dQw4w9WgXcQ"
  期待: 利用可能な字幕の言語リスト、種類（手動/自動）、最終更新日時

テストケース2: 複数言語の字幕がある動画
  入力: videoId: "多言語対応動画ID"
  期待: 複数の言語エントリ（日本語、英語など）

テストケース3: 自動生成字幕のみの動画
  入力: videoId: "自動字幕のみ動画ID"
  期待: trackKind: "asr"（自動音声認識）の字幕

テストケース4: 字幕がない動画
  入力: videoId: "字幕なし動画ID"
  期待: 空の配列[]

テストケース5: 削除された/プライベート動画
  入力: videoId: "削除された動画ID"
  期待: エラーメッセージまたは空の結果

テストケース6: 無効な動画ID
  入力: videoId: "invalid_id_12345"
  期待: エラーメッセージ「Video not found」
```

### 手動テスト実行例

```bash
# MCP経由でツールを直接呼び出す場合
# ツール名: mcp__youtube-mcp__get_transcript_metadata

# 基本的な使用例
mcp__youtube-mcp__get_transcript_metadata({
  "videoId": "dQw4w9WgXcQ"
})

# 期待される戻り値の例
[
  {
    "id": "caption_id_1",
    "language": "en",
    "name": "English",
    "trackKind": "standard",
    "isAutoSynced": false,
    "lastUpdated": "2024-01-01T00:00:00Z"
  },
  {
    "id": "caption_id_2",
    "language": "ja",
    "name": "日本語",
    "trackKind": "standard",
    "isAutoSynced": false,
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
]
```

## 12. 字幕テキストの取得

**注意**: この機能はyt-dlpのインストールが必要です。

### インストール確認

```bash
# yt-dlpがインストールされているか確認
yt-dlp --version
```

### 基本テストケース

```yaml
テストケース1: 英語字幕の取得
  入力:
    videoId: "dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up
    language: "en"
  期待: 英語字幕のセグメント配列（タイムスタンプ付き）

テストケース2: 日本語字幕の取得
  入力:
    videoId: "RCltAg_iK0E"  # AKASAKI - Bunny Girl
    language: "ja"
  期待: 日本語字幕のセグメント配列

テストケース3: 時間範囲指定
  入力:
    videoId: "dQw4w9WgXcQ"
    language: "en"
    startTime: 60
    endTime: 120
  期待: 1分〜2分の字幕のみ

テストケース4: 存在しない言語
  入力:
    videoId: "dQw4w9WgXcQ"
    language: "xx"
  期待: エラー「No subtitles available for language: xx」

テストケース5: yt-dlp未インストール
  前提: yt-dlpがインストールされていない環境
  期待: エラー「yt-dlp is not installed. Please install it first: https://github.com/yt-dlp/yt-dlp/wiki/Installation」
```

### 手動テスト実行例

```bash
# MCP経由でツールを直接呼び出す場合
# ツール名: mcp__youtube-mcp__get_transcript

# 基本的な使用例
mcp__youtube-mcp__get_transcript({
  "videoId": "dQw4w9WgXcQ",
  "language": "en"
})

# 時間範囲指定の例
mcp__youtube-mcp__get_transcript({
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "startTime": 30,
  "endTime": 60
})

# 期待される戻り値の例
{
  "segments": [
    {
      "start": 0.84,
      "end": 3.629,
      "text": "We're no strangers to love"
    },
    {
      "start": 3.639,
      "end": 6.67,
      "text": "You know the rules and so do I"
    }
  ]
}
```
