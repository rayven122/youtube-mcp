import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getVideo, searchVideos } from "@/api/videos/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { handleVideoTool } from "@/mcp/tools/videos.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// videosAPIをモック化
vi.mock("@/api/videos/index.js", () => ({
  getVideo: vi.fn(),
  searchVideos: vi.fn(),
}));

const mockGetVideo = vi.mocked(getVideo);
const mockSearchVideos = vi.mocked(searchVideos);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("handleVideoTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get_video", () => {
    const mockVideoData = {
      id: "test-video-id",
      title: "テスト動画",
      description: "テスト動画の説明",
      channelId: "test-channel-id",
      channelTitle: "テストチャンネル",
      publishedAt: "2023-01-01T00:00:00Z",
      duration: "PT10M30S",
      viewCount: "1000",
      likeCount: "100",
      commentCount: "10",
      thumbnails: {},
      tags: [],
      categoryId: "22",
    };

    test("正常系: 動画情報を取得して正しいレスポンスを返す", async () => {
      mockGetVideo.mockResolvedValueOnce(ok(mockVideoData));

      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
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
      expect(mockGetVideo).toHaveBeenCalledWith("test-video-id", mockApiKey, undefined);
    });

    test("正常系: カスタムpartsパラメータで動画情報を取得する", async () => {
      mockGetVideo.mockResolvedValueOnce(ok(mockVideoData));

      await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id", parts: ["snippet"] },
        mockApiKey,
      );

      expect(mockGetVideo).toHaveBeenCalledWith("test-video-id", mockApiKey, ["snippet"]);
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetVideo.mockResolvedValueOnce(err(new Error("API Error")));

      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("API Error"));
    });
  });

  describe("search_videos", () => {
    const mockSearchResults = [
      {
        id: "search-video-id",
        title: "検索結果動画",
        description: "検索結果の説明",
        channelId: "search-channel-id",
        channelTitle: "検索チャンネル",
        publishedAt: "2023-01-01T00:00:00Z",
        thumbnails: {},
        type: "video" as const,
      },
    ];

    test("正常系: デフォルトパラメータで動画を検索する", async () => {
      mockSearchVideos.mockResolvedValueOnce(ok(mockSearchResults));

      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
        { query: "test query" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockSearchResults),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockSearchVideos).toHaveBeenCalledWith(
        "test query",
        mockApiKey,
        10,
        "relevance",
        "video",
      );
    });

    test("正常系: カスタムパラメータで動画を検索する", async () => {
      mockSearchVideos.mockResolvedValueOnce(ok(mockSearchResults));

      await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
        {
          query: "test query",
          maxResults: 20,
          order: "date",
          type: "channel",
        },
        mockApiKey,
      );

      expect(mockSearchVideos).toHaveBeenCalledWith(
        "test query",
        mockApiKey,
        20,
        "date",
        "channel",
      );
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockSearchVideos.mockResolvedValueOnce(err(new Error("Search API Error")));

      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
        { query: "test query" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Search API Error"));
    });
  });

  describe("unknown tool", () => {
    test("異常系: 不明なツール名の場合にエラーを返す", async () => {
      const result = await handleVideoTool("unknown_tool", {}, mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Unknown tool: unknown_tool"),
      );
    });
  });

  describe("exception handling", () => {
    test("異常系: 予期しない例外が発生した場合にエラーを返す", async () => {
      mockGetVideo.mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Unexpected error"));
    });

    test("異常系: 非Errorオブジェクトが投げられた場合に文字列化してエラーを返す", async () => {
      mockGetVideo.mockRejectedValueOnce("string error");

      const result = await handleVideoTool(
        YOU_TUBE_TOOL_NAMES.GET_VIDEO,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("string error"));
    });
  });
});
