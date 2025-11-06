import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  SearchResult,
  VideoDetails,
  YouTubeApiResponse,
  YouTubeApiSearchItem,
  YouTubeApiVideoItem,
} from "@/api/types.js";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { getVideo, searchVideos } from "@/api/videos/index.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// fetchApiをモック化
vi.mock("@/api/fetcher.js", () => ({
  fetchApi: vi.fn(),
}));

const mockFetchApi = vi.mocked(fetchApi);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("videos API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVideo", () => {
    const mockVideoResponse: YouTubeApiResponse<YouTubeApiVideoItem> = {
      kind: "youtube#videoListResponse",
      etag: "test-etag",
      items: [
        {
          kind: "youtube#video",
          etag: "test-etag",
          id: "test-video-id",
          snippet: {
            publishedAt: "2023-01-01T00:00:00Z",
            channelId: "test-channel-id",
            title: "テスト動画",
            description: "テスト動画の説明",
            thumbnails: {
              default: {
                url: "https://example.com/thumb.jpg",
                width: 120,
                height: 90,
              },
            },
            channelTitle: "テストチャンネル",
            tags: ["test", "video"],
            categoryId: "22",
          },
          contentDetails: {
            duration: "PT10M30S",
          },
          statistics: {
            viewCount: "1000",
            likeCount: "100",
            commentCount: "10",
          },
        },
      ],
    };

    test("正常系: デフォルトパラメータで動画情報を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockVideoResponse));

      const result = await getVideo("test-video-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
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
        thumbnails: {
          default: {
            url: "https://example.com/thumb.jpg",
            width: 120,
            height: 90,
          },
        },
        tags: ["test", "video"],
        categoryId: "22",
      } satisfies VideoDetails);
      expect(mockFetchApi).toHaveBeenCalledWith(
        "videos",
        { id: "test-video-id", part: "snippet,statistics,contentDetails" },
        mockApiKey,
      );
    });

    test("正常系: カスタムpartsで動画情報を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockVideoResponse));

      await getVideo("test-video-id", mockApiKey, ["snippet"]);

      expect(mockFetchApi).toHaveBeenCalledWith(
        "videos",
        { id: "test-video-id", part: "snippet" },
        mockApiKey,
      );
    });

    test("正常系: 部分的なデータでもデフォルト値でマップされる", async () => {
      const incompleteResponse: YouTubeApiResponse<YouTubeApiVideoItem> = {
        kind: "youtube#videoListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#video",
            etag: "test-etag",
            id: "test-video-id",
            snippet: {},
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(incompleteResponse));

      const result = await getVideo("test-video-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        id: "test-video-id",
        title: "",
        description: "",
        channelId: "",
        channelTitle: "",
        publishedAt: "",
        duration: "",
        viewCount: "0",
        likeCount: "0",
        commentCount: "0",
        thumbnails: {},
        tags: [],
        categoryId: "",
      } satisfies VideoDetails);
    });

    test("異常系: 動画が見つからない場合にエラーを返す", async () => {
      const emptyResponse: YouTubeApiResponse<YouTubeApiVideoItem> = {
        kind: "youtube#videoListResponse",
        etag: "test-etag",
        items: [],
      };

      mockFetchApi.mockResolvedValueOnce(ok(emptyResponse));

      const result = await getVideo("not-found", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new YouTubeApiError("Video not found: not-found"),
      );
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("API Error")));

      const result = await getVideo("test-video-id", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("API Error"));
    });
  });

  describe("searchVideos", () => {
    const mockSearchResponse: YouTubeApiResponse<YouTubeApiSearchItem> = {
      kind: "youtube#searchListResponse",
      etag: "test-etag",
      items: [
        {
          kind: "youtube#searchResult",
          etag: "test-etag",
          id: {
            kind: "youtube#video",
            videoId: "search-video-id",
          },
          snippet: {
            publishedAt: "2023-01-01T00:00:00Z",
            channelId: "search-channel-id",
            title: "検索結果動画",
            description: "検索結果の説明",
            thumbnails: {
              default: {
                url: "https://example.com/search-thumb.jpg",
                width: 120,
                height: 90,
              },
            },
            channelTitle: "検索チャンネル",
          },
        },
      ],
    };

    test("正常系: デフォルトパラメータで動画を検索する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockSearchResponse));

      const result = await searchVideos("test query", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "search-video-id",
          title: "検索結果動画",
          description: "検索結果の説明",
          channelId: "search-channel-id",
          channelTitle: "検索チャンネル",
          publishedAt: "2023-01-01T00:00:00Z",
          thumbnails: {
            default: {
              url: "https://example.com/search-thumb.jpg",
              width: 120,
              height: 90,
            },
          },
          type: "video",
        } satisfies SearchResult,
      ]);
      expect(mockFetchApi).toHaveBeenCalledWith(
        "search",
        {
          q: "test query",
          part: "snippet",
          maxResults: 10,
          order: "relevance",
          type: "video",
        },
        mockApiKey,
      );
    });

    test("正常系: カスタムパラメータで検索する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockSearchResponse));

      await searchVideos("test", mockApiKey, 20, "date", "channel");

      expect(mockFetchApi).toHaveBeenCalledWith(
        "search",
        {
          q: "test",
          part: "snippet",
          maxResults: 20,
          order: "date",
          type: "channel",
        },
        mockApiKey,
      );
    });

    test("正常系: 異なるタイプのIDを正しくマップする", async () => {
      const channelResponse: YouTubeApiResponse<YouTubeApiSearchItem> = {
        kind: "youtube#searchListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#searchResult",
            etag: "test-etag",
            id: {
              kind: "youtube#channel",
              channelId: "channel-id",
            },
            snippet: {
              title: "チャンネル結果",
            },
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(channelResponse));

      const result = await searchVideos("test", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "channel-id",
          type: "channel",
          title: "チャンネル結果",
          description: "",
          publishedAt: "",
          channelId: "",
          channelTitle: "",
          thumbnails: {},
        } satisfies SearchResult,
      ]);
    });

    test("正常系: 空の結果の場合に空配列を返す", async () => {
      const emptyResponse: YouTubeApiResponse<YouTubeApiSearchItem> = {
        kind: "youtube#searchListResponse",
        etag: "test-etag",
        items: [],
      };

      mockFetchApi.mockResolvedValueOnce(ok(emptyResponse));

      const result = await searchVideos("no results", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([]);
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("Search API Error")));

      const result = await searchVideos("test", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Search API Error"));
    });

    test("正常系: idが文字列の検索結果もマップされる", async () => {
      const responseWithStringId: YouTubeApiResponse<YouTubeApiSearchItem> = {
        kind: "youtube#searchListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#searchResult",
            etag: "test-etag",
            id: "string-id-12345" as any, // 文字列IDのケース
            snippet: {
              publishedAt: "2023-01-01T00:00:00Z",
              channelId: "test-channel",
              title: "Test Video with String ID",
              description: "Description",
              thumbnails: {},
              channelTitle: "Test Channel",
            },
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(responseWithStringId));

      const result = await searchVideos("test", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "string-id-12345",
          title: "Test Video with String ID",
          description: "Description",
          channelId: "test-channel",
          channelTitle: "Test Channel",
          publishedAt: "2023-01-01T00:00:00Z",
          thumbnails: {},
          type: "video",
        } satisfies SearchResult,
      ]);
    });
  });
});
