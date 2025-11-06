import { z } from "zod";

// Tool Input Schemas (Zod)
export const GetVideoSchema = z.object({
  videoId: z.string().min(1).describe("YouTube動画のID"),
  parts: z
    .array(z.enum(["snippet", "statistics", "contentDetails"]))
    .optional()
    .describe("取得する情報の種類"),
});

export const SearchVideosSchema = z.object({
  query: z.string().min(1).describe("検索クエリ"),
  maxResults: z.number().min(1).max(50).optional().default(10).describe("最大取得件数"),
  order: z
    .enum(["relevance", "date", "rating", "viewCount", "title"])
    .optional()
    .default("relevance")
    .describe("並び順"),
  type: z
    .enum(["video", "channel", "playlist"])
    .optional()
    .default("video")
    .describe("検索対象のタイプ"),
});

export const GetChannelSchema = z.object({
  channelId: z.string().min(1).describe("YouTubeチャンネルのID"),
});

export const GetChannelVideosSchema = z.object({
  channelId: z.string().min(1).describe("YouTubeチャンネルのID"),
  maxResults: z.number().min(1).max(50).optional().default(10).describe("最大取得件数"),
  order: z
    .enum(["date", "rating", "viewCount", "title"])
    .optional()
    .default("date")
    .describe("並び順"),
});

export const GetPlaylistSchema = z.object({
  playlistId: z.string().min(1).describe("YouTubeプレイリストのID"),
});

export const GetPlaylistItemsSchema = z.object({
  playlistId: z.string().min(1).describe("YouTubeプレイリストのID"),
  maxResults: z.number().min(1).max(50).optional().default(10).describe("最大取得件数"),
});

export const GetCommentThreadsSchema = z.object({
  videoId: z.string().min(1).describe("YouTube動画のID"),
  maxResults: z.number().min(1).max(100).optional().default(20).describe("最大取得件数"),
  pageToken: z.string().optional().describe("ページネーショントークン"),
  order: z.enum(["relevance", "time"]).optional().default("relevance").describe("並び順"),
});

export const GetCommentRepliesSchema = z.object({
  parentId: z.string().min(1).describe("親コメントのID"),
  maxResults: z.number().min(1).max(100).optional().default(20).describe("最大取得件数"),
  pageToken: z.string().optional().describe("ページネーショントークン"),
});

export const GetTranscriptMetadataSchema = z.object({
  videoId: z.string().min(1).describe("YouTube動画のID"),
});

export const GetTranscriptSchema = z.object({
  videoId: z.string().min(1).describe("YouTube動画のID"),
  language: z.string().min(1).describe("言語コード（例: ja, en）"),
  startTime: z.number().min(0).optional().describe("開始時間（秒）"),
  endTime: z.number().min(0).optional().describe("終了時間（秒）"),
});

// Tool Input Types
export type GetVideoInput = z.infer<typeof GetVideoSchema>;
export type SearchVideosInput = z.infer<typeof SearchVideosSchema>;
export type GetChannelInput = z.infer<typeof GetChannelSchema>;
export type GetChannelVideosInput = z.infer<typeof GetChannelVideosSchema>;
export type GetPlaylistInput = z.infer<typeof GetPlaylistSchema>;
export type GetPlaylistItemsInput = z.infer<typeof GetPlaylistItemsSchema>;
export type GetCommentThreadsInput = z.infer<typeof GetCommentThreadsSchema>;
export type GetCommentRepliesInput = z.infer<typeof GetCommentRepliesSchema>;
export type GetTranscriptMetadataInput = z.infer<typeof GetTranscriptMetadataSchema>;
export type GetTranscriptInput = z.infer<typeof GetTranscriptSchema>;
