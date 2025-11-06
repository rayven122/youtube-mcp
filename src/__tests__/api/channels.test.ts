import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  ChannelDetails,
  SearchResult,
  YouTubeApiChannelItem,
  YouTubeApiResponse,
  YouTubeApiSearchItem,
} from "@/api/types.js";
import { getChannel, getChannelVideos } from "@/api/channels/index.js";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// fetchApiをモック化
vi.mock("@/api/fetcher.js", () => ({
  fetchApi: vi.fn(),
}));

const mockFetchApi = vi.mocked(fetchApi);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("channels API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getChannel", () => {
    const mockChannelResponse: YouTubeApiResponse<YouTubeApiChannelItem> = {
      kind: "youtube#channelListResponse",
      etag: "test-etag",
      items: [
        {
          kind: "youtube#channel",
          etag: "test-etag",
          id: "test-channel-id",
          snippet: {
            title: "テストチャンネル",
            description: "テストチャンネルの説明",
            customUrl: "@testchannel",
            publishedAt: "2020-01-01T00:00:00Z",
            thumbnails: {
              default: {
                url: "https://example.com/channel-thumb.jpg",
                width: 88,
                height: 88,
              },
            },
            country: "JP",
          },
          statistics: {
            viewCount: "10000",
            subscriberCount: "1000",
            hiddenSubscriberCount: false,
            videoCount: "100",
          },
        },
      ],
    };

    test("正常系: チャンネル情報を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockChannelResponse));

      const result = await getChannel("test-channel-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        id: "test-channel-id",
        title: "テストチャンネル",
        description: "テストチャンネルの説明",
        customUrl: "@testchannel",
        publishedAt: "2020-01-01T00:00:00Z",
        thumbnails: {
          default: {
            url: "https://example.com/channel-thumb.jpg",
            width: 88,
            height: 88,
          },
        },
        viewCount: "10000",
        subscriberCount: "1000",
        videoCount: "100",
        uploads: undefined,
      } satisfies ChannelDetails);
      expect(mockFetchApi).toHaveBeenCalledWith(
        "channels",
        { id: "test-channel-id", part: "snippet,statistics" },
        mockApiKey,
      );
    });

    test("正常系: 部分的なデータでもデフォルト値でマップされる", async () => {
      const incompleteResponse: YouTubeApiResponse<YouTubeApiChannelItem> = {
        kind: "youtube#channelListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#channel",
            etag: "test-etag",
            id: "test-channel-id",
            snippet: {},
            statistics: {},
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(incompleteResponse));

      const result = await getChannel("test-channel-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        id: "test-channel-id",
        title: "",
        description: "",
        customUrl: undefined,
        publishedAt: "",
        thumbnails: {},
        viewCount: "0",
        subscriberCount: "0",
        videoCount: "0",
        uploads: undefined,
      } satisfies ChannelDetails);
    });

    test("異常系: チャンネルが見つからない場合にエラーを返す", async () => {
      const emptyResponse: YouTubeApiResponse<YouTubeApiChannelItem> = {
        kind: "youtube#channelListResponse",
        etag: "test-etag",
        items: [],
      };

      mockFetchApi.mockResolvedValueOnce(ok(emptyResponse));

      const result = await getChannel("not-found", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new YouTubeApiError("Channel not found: not-found"),
      );
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("API Error")));

      const result = await getChannel("test-channel-id", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("API Error"));
    });
  });

  describe("getChannelVideos", () => {
    const mockChannelVideosResponse: YouTubeApiResponse<YouTubeApiSearchItem> = {
      kind: "youtube#searchListResponse",
      etag: "test-etag",
      items: [
        {
          kind: "youtube#searchResult",
          etag: "test-etag",
          id: {
            kind: "youtube#video",
            videoId: "channel-video-id",
          },
          snippet: {
            publishedAt: "2023-01-01T00:00:00Z",
            channelId: "test-channel-id",
            title: "チャンネル動画",
            description: "チャンネル動画の説明",
            thumbnails: {},
            channelTitle: "テストチャンネル",
          },
        },
      ],
    };

    test("正常系: デフォルトパラメータでチャンネル動画を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockChannelVideosResponse));

      const result = await getChannelVideos("test-channel-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "channel-video-id",
          title: "チャンネル動画",
          description: "チャンネル動画の説明",
          publishedAt: "2023-01-01T00:00:00Z",
          channelId: "test-channel-id",
          channelTitle: "テストチャンネル",
          thumbnails: {},
          type: "video",
        } satisfies SearchResult,
      ]);
      expect(mockFetchApi).toHaveBeenCalledWith(
        "search",
        {
          channelId: "test-channel-id",
          part: "snippet",
          maxResults: 10,
          order: "date",
          type: "video",
        },
        mockApiKey,
      );
    });

    test("正常系: カスタムパラメータでチャンネル動画を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockChannelVideosResponse));

      await getChannelVideos("test-channel-id", mockApiKey, 20, "viewCount");

      expect(mockFetchApi).toHaveBeenCalledWith(
        "search",
        {
          channelId: "test-channel-id",
          part: "snippet",
          maxResults: 20,
          order: "viewCount",
          type: "video",
        },
        mockApiKey,
      );
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("Channel Videos API Error")));

      const result = await getChannelVideos("test-channel-id", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Channel Videos API Error"),
      );
    });
  });
});
