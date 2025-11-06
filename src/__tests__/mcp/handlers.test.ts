import type { YoutubeApiKey } from "@/api/apiKey.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { handleToolRequest } from "@/mcp/handlers.js";
import { handleChannelTool } from "@/mcp/tools/channels.js";
import { handleCommentTool } from "@/mcp/tools/comments.js";
import { handlePlaylistTool } from "@/mcp/tools/playlists.js";
import { handleTranscriptTool } from "@/mcp/tools/transcripts.js";
import { handleVideoTool } from "@/mcp/tools/videos.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// ツールハンドラーをモック化
vi.mock("@/mcp/tools/videos.js", () => ({
  handleVideoTool: vi.fn(),
}));

vi.mock("@/mcp/tools/channels.js", () => ({
  handleChannelTool: vi.fn(),
}));

vi.mock("@/mcp/tools/playlists.js", () => ({
  handlePlaylistTool: vi.fn(),
}));

vi.mock("@/mcp/tools/comments.js", () => ({
  handleCommentTool: vi.fn(),
}));

vi.mock("@/mcp/tools/transcripts.js", () => ({
  handleTranscriptTool: vi.fn(),
}));

const mockHandleVideoTool = vi.mocked(handleVideoTool);
const mockHandleChannelTool = vi.mocked(handleChannelTool);
const mockHandlePlaylistTool = vi.mocked(handlePlaylistTool);
const mockHandleCommentTool = vi.mocked(handleCommentTool);
const mockHandleTranscriptTool = vi.mocked(handleTranscriptTool);

const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("handleToolRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("video tools", () => {
    test("正常系: get_videoツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '{"id": "test"}' }],
      };
      mockHandleVideoTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleVideoTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
        mockApiKey,
      );
    });

    test("正常系: search_videosツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '[{"id": "test"}]' }],
      };
      mockHandleVideoTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
        { query: "test query" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleVideoTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
        { query: "test query" },
        mockApiKey,
      );
    });

    test("異常系: videoツールでエラーが発生した場合にエラーを返す", async () => {
      mockHandleVideoTool.mockResolvedValueOnce(err(new Error("Video tool error")));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Video tool error"));
    });
  });

  describe("channel tools", () => {
    test("正常系: get_channelツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '{"id": "test-channel"}' }],
      };
      mockHandleChannelTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleChannelTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );
    });

    test("正常系: get_channel_videosツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '[{"id": "channel-video"}]' }],
      };
      mockHandleChannelTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleChannelTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
        { channelId: "test-channel-id" },
        mockApiKey,
      );
    });

    test("異常系: channelツールでエラーが発生した場合にエラーを返す", async () => {
      mockHandleChannelTool.mockResolvedValueOnce(err(new Error("Channel tool error")));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Channel tool error"));
    });
  });

  describe("playlist tools", () => {
    test("正常系: get_playlistツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '{"id": "test-playlist"}' }],
      };
      mockHandlePlaylistTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandlePlaylistTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );
    });

    test("正常系: get_playlist_itemsツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '[{"id": "playlist-item"}]' }],
      };
      mockHandlePlaylistTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandlePlaylistTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );
    });

    test("異常系: playlistツールでエラーが発生した場合にエラーを返す", async () => {
      mockHandlePlaylistTool.mockResolvedValueOnce(err(new Error("Playlist tool error")));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Playlist tool error"));
    });
  });

  describe("comment tools", () => {
    test("正常系: get_comment_threadsツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '{"threads": []}' }],
      };
      mockHandleCommentTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleCommentTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );
    });

    test("正常系: get_comment_repliesツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '{"comments": []}' }],
      };
      mockHandleCommentTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
        { parentId: "parent-comment-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleCommentTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
        { parentId: "parent-comment-id" },
        mockApiKey,
      );
    });

    test("異常系: commentツールでエラーが発生した場合にエラーを返す", async () => {
      mockHandleCommentTool.mockResolvedValueOnce(err(new Error("Comment tool error")));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Comment tool error"));
    });
  });

  describe("transcript tools", () => {
    test("正常系: get_transcript_metadataツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: "[]" }],
      };
      mockHandleTranscriptTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT_METADATA,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleTranscriptTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT_METADATA,
        { videoId: "test-video-id" },
        mockApiKey,
      );
    });

    test("正常系: get_transcriptツールを正しくルーティングする", async () => {
      const mockResponse = {
        content: [{ type: "text" as const, text: '{"segments": []}' }],
      };
      mockHandleTranscriptTool.mockResolvedValueOnce(ok(mockResponse));

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT,
        { videoId: "test-video-id", language: "en" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
      expect(mockHandleTranscriptTool).toHaveBeenCalledWith(
        YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT,
        { videoId: "test-video-id", language: "en" },
        mockApiKey,
      );
    });

    test("異常系: transcriptツールでエラーが発生した場合にエラーを返す", async () => {
      mockHandleTranscriptTool.mockResolvedValueOnce(
        err(new Error("Transcript tool error")),
      );

      const result = await handleToolRequest(
        YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT_METADATA,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Transcript tool error"));
    });
  });

  describe("unknown tool", () => {
    test("異常系: 不明なツール名の場合にエラーを返す", async () => {
      const result = await handleToolRequest("unknown_tool", {}, mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Unknown tool: unknown_tool"),
      );

      // 各ハンドラーが呼ばれていないことを確認
      expect(mockHandleVideoTool).not.toHaveBeenCalled();
      expect(mockHandleChannelTool).not.toHaveBeenCalled();
      expect(mockHandlePlaylistTool).not.toHaveBeenCalled();
      expect(mockHandleCommentTool).not.toHaveBeenCalled();
      expect(mockHandleTranscriptTool).not.toHaveBeenCalled();
    });
  });
});
