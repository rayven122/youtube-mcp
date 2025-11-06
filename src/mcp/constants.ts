/**
 * YouTube MCP ツール名定義
 * 全てのツール名は ACTION_RESOURCE 形式に従う
 */

// アクションとリソースの型定義
type Action = "GET" | "SEARCH";
type Resource = string; // video, videos, channel, channel_videos, etc.
type ToolName = `${Lowercase<Action>}_${Lowercase<Resource>}`;

// ツール名定義（as const で不変にし、satisfies で型制約を設ける）
export const YOU_TUBE_TOOL_NAMES = {
  // Video tools
  GET_VIDEO: "get_video", // 単一動画取得（ID指定）
  SEARCH_VIDEOS: "search_videos", // 動画検索（クエリ指定）

  // Channel tools
  GET_CHANNEL: "get_channel", // 単一チャンネル取得
  GET_CHANNEL_VIDEOS: "get_channel_videos", // チャンネルの動画一覧

  // Playlist tools
  GET_PLAYLIST: "get_playlist", // 単一プレイリスト取得
  GET_PLAYLIST_ITEMS: "get_playlist_items", // プレイリスト内動画一覧

  // Comment tools
  GET_COMMENT_THREADS: "get_comment_threads", // コメントスレッド一覧
  GET_COMMENT_REPLIES: "get_comment_replies", // 返信コメント一覧

  // Transcript tools
  GET_TRANSCRIPT_METADATA: "get_transcript_metadata", // 字幕メタデータ取得
  GET_TRANSCRIPT: "get_transcript", // 字幕テキスト取得
} as const satisfies Record<string, ToolName>;

// ツールカテゴリ定義
export const TOOL_CATEGORIES = {
  VIDEO: "video",
  CHANNEL: "channel",
  PLAYLIST: "playlist",
  COMMENT: "comment",
  TRANSCRIPT: "transcript",
} as const;
