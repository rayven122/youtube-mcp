import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getPlaylist, getPlaylistItems } from "@/api/playlists/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { handlePlaylistTool } from "@/mcp/tools/playlists.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// playlistsAPIをモック化
vi.mock("@/api/playlists/index.js", () => ({
  getPlaylist: vi.fn(),
  getPlaylistItems: vi.fn(),
}));

const mockGetPlaylist = vi.mocked(getPlaylist);
const mockGetPlaylistItems = vi.mocked(getPlaylistItems);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("handlePlaylistTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get_playlist", () => {
    const mockPlaylistData = {
      id: "test-playlist-id",
      title: "テストプレイリスト",
      description: "テストプレイリストの説明",
      channelId: "test-channel-id",
      channelTitle: "テストチャンネル",
      publishedAt: "2023-01-01T00:00:00Z",
      thumbnails: {},
      itemCount: 5,
      privacy: "public",
    };

    test("正常系: プレイリスト情報を取得して正しいレスポンスを返す", async () => {
      mockGetPlaylist.mockResolvedValueOnce(ok(mockPlaylistData));

      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockPlaylistData),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockGetPlaylist).toHaveBeenCalledWith("test-playlist-id", mockApiKey);
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetPlaylist.mockResolvedValueOnce(err(new Error("Playlist API Error")));

      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Playlist API Error"));
    });
  });

  describe("get_playlist_items", () => {
    const mockPlaylistItems = [
      {
        id: "playlist-item-id",
        title: "プレイリスト動画",
        description: "プレイリスト動画の説明",
        videoId: "playlist-video-id",
        playlistId: "test-playlist-id",
        position: 0,
        thumbnails: {},
        channelId: "test-channel-id",
        channelTitle: "テストチャンネル",
        publishedAt: "2023-01-01T00:00:00Z",
      },
    ];

    test("正常系: デフォルトパラメータでプレイリストアイテムを取得する", async () => {
      mockGetPlaylistItems.mockResolvedValueOnce(ok(mockPlaylistItems));

      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockPlaylistItems),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockGetPlaylistItems).toHaveBeenCalledWith(
        "test-playlist-id",
        mockApiKey,
        10,
      );
    });

    test("正常系: カスタムmaxResultsでプレイリストアイテムを取得する", async () => {
      mockGetPlaylistItems.mockResolvedValueOnce(ok(mockPlaylistItems));

      await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
        {
          playlistId: "test-playlist-id",
          maxResults: 25,
        },
        mockApiKey,
      );

      expect(mockGetPlaylistItems).toHaveBeenCalledWith(
        "test-playlist-id",
        mockApiKey,
        25,
      );
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetPlaylistItems.mockResolvedValueOnce(
        err(new Error("Playlist Items API Error")),
      );

      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Playlist Items API Error"),
      );
    });
  });

  describe("unknown tool", () => {
    test("異常系: 不明なツール名の場合にエラーを返す", async () => {
      const result = await handlePlaylistTool("unknown_tool", {}, mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Unknown tool: unknown_tool"),
      );
    });
  });

  describe("exception handling", () => {
    test("異常系: 予期しない例外が発生した場合にエラーを返す", async () => {
      mockGetPlaylist.mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Unexpected error"));
    });

    test("異常系: 非Errorオブジェクトが投げられた場合に文字列化してエラーを返す", async () => {
      mockGetPlaylist.mockRejectedValueOnce("string error");

      const result = await handlePlaylistTool(
        YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
        { playlistId: "test-playlist-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("string error"));
    });
  });
});
