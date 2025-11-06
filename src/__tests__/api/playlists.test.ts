import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  PlaylistDetails,
  PlaylistItem,
  YouTubeApiPlaylistItem,
  YouTubeApiPlaylistItemResource,
  YouTubeApiResponse,
} from "@/api/types.js";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { getPlaylist, getPlaylistItems } from "@/api/playlists/index.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// fetchApiをモック化
vi.mock("@/api/fetcher.js", () => ({
  fetchApi: vi.fn(),
}));

const mockFetchApi = vi.mocked(fetchApi);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("playlists API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlaylist", () => {
    const mockPlaylistResponse: YouTubeApiResponse<YouTubeApiPlaylistItem> = {
      kind: "youtube#playlistListResponse",
      etag: "test-etag",
      items: [
        {
          kind: "youtube#playlist",
          etag: "test-etag",
          id: "test-playlist-id",
          snippet: {
            publishedAt: "2023-01-01T00:00:00Z",
            channelId: "test-channel-id",
            title: "テストプレイリスト",
            description: "テストプレイリストの説明",
            thumbnails: {
              default: {
                url: "https://example.com/playlist-thumb.jpg",
                width: 120,
                height: 90,
              },
            },
            channelTitle: "テストチャンネル",
          },
          contentDetails: {
            itemCount: 5,
          },
          status: {
            privacyStatus: "public",
          },
        },
      ],
    };

    test("正常系: プレイリスト情報を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockPlaylistResponse));

      const result = await getPlaylist("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        id: "test-playlist-id",
        title: "テストプレイリスト",
        description: "テストプレイリストの説明",
        channelId: "test-channel-id",
        channelTitle: "テストチャンネル",
        publishedAt: "2023-01-01T00:00:00Z",
        thumbnails: {
          default: {
            url: "https://example.com/playlist-thumb.jpg",
            width: 120,
            height: 90,
          },
        },
        itemCount: 5,
        privacy: "public",
      } satisfies PlaylistDetails);
      expect(mockFetchApi).toHaveBeenCalledWith(
        "playlists",
        { id: "test-playlist-id", part: "snippet,contentDetails" },
        mockApiKey,
      );
    });

    test("正常系: 部分的なデータでもデフォルト値でマップされる", async () => {
      const incompleteResponse: YouTubeApiResponse<YouTubeApiPlaylistItem> = {
        kind: "youtube#playlistListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#playlist",
            etag: "test-etag",
            id: "test-playlist-id",
            snippet: {},
            contentDetails: {},
            status: {},
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(incompleteResponse));

      const result = await getPlaylist("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        id: "test-playlist-id",
        title: "",
        description: "",
        channelId: "",
        channelTitle: "",
        publishedAt: "",
        thumbnails: {},
        itemCount: 0,
        privacy: "public",
      } satisfies PlaylistDetails);
    });

    test("異常系: プレイリストが見つからない場合にエラーを返す", async () => {
      const emptyResponse: YouTubeApiResponse<YouTubeApiPlaylistItem> = {
        kind: "youtube#playlistListResponse",
        etag: "test-etag",
        items: [],
      };

      mockFetchApi.mockResolvedValueOnce(ok(emptyResponse));

      const result = await getPlaylist("not-found", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new YouTubeApiError("Playlist not found: not-found"),
      );
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("API Error")));

      const result = await getPlaylist("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("API Error"));
    });
  });

  describe("getPlaylistItems", () => {
    const mockPlaylistItemsResponse: YouTubeApiResponse<YouTubeApiPlaylistItemResource> =
      {
        kind: "youtube#playlistItemListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#playlistItem",
            etag: "test-etag",
            id: "playlist-item-id",
            snippet: {
              publishedAt: "2023-01-01T00:00:00Z",
              channelId: "test-channel-id",
              title: "プレイリスト動画",
              description: "プレイリスト動画の説明",
              channelTitle: "テストチャンネル",
              playlistId: "test-playlist-id",
              position: 0,
              resourceId: {
                kind: "youtube#video",
                videoId: "playlist-video-id",
              },
              thumbnails: {
                default: {
                  url: "https://example.com/playlist-item-thumb.jpg",
                  width: 120,
                  height: 90,
                },
              },
            },
            contentDetails: {
              videoId: "playlist-video-id",
            },
          },
        ],
      };

    test("正常系: デフォルトパラメータでプレイリストアイテムを取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockPlaylistItemsResponse));

      const result = await getPlaylistItems("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "playlist-item-id",
          title: "プレイリスト動画",
          description: "プレイリスト動画の説明",
          videoId: "playlist-video-id",
          channelId: "test-channel-id",
          channelTitle: "テストチャンネル",
          playlistId: "test-playlist-id",
          position: 0,
          publishedAt: "2023-01-01T00:00:00Z",
          thumbnails: {
            default: {
              url: "https://example.com/playlist-item-thumb.jpg",
              width: 120,
              height: 90,
            },
          },
        } satisfies PlaylistItem,
      ]);
      expect(mockFetchApi).toHaveBeenCalledWith(
        "playlistItems",
        {
          playlistId: "test-playlist-id",
          part: "snippet,contentDetails",
          maxResults: 10,
        },
        mockApiKey,
      );
    });

    test("正常系: カスタムmaxResultsでプレイリストアイテムを取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockPlaylistItemsResponse));

      await getPlaylistItems("test-playlist-id", mockApiKey, 25);

      expect(mockFetchApi).toHaveBeenCalledWith(
        "playlistItems",
        {
          playlistId: "test-playlist-id",
          part: "snippet,contentDetails",
          maxResults: 25,
        },
        mockApiKey,
      );
    });

    test("正常系: contentDetailsなしでもresourceIdからvideoIdを取得する", async () => {
      const itemWithoutContentDetails: YouTubeApiResponse<YouTubeApiPlaylistItemResource> =
        {
          kind: "youtube#playlistItemListResponse",
          etag: "test-etag",
          items: [
            {
              kind: "youtube#playlistItem",
              etag: "test-etag",
              id: "playlist-item-id-2",
              snippet: {
                resourceId: {
                  kind: "youtube#video",
                  videoId: "resource-video-id",
                },
              },
            },
          ],
        };

      mockFetchApi.mockResolvedValueOnce(ok(itemWithoutContentDetails));

      const result = await getPlaylistItems("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "playlist-item-id-2",
          videoId: "resource-video-id",
          title: "",
          description: "",
          thumbnails: {},
          publishedAt: "",
          channelId: "",
          channelTitle: "",
          playlistId: "",
          position: 0,
        } satisfies PlaylistItem,
      ]);
    });

    test("正常系: positionがない場合はインデックスを使用する", async () => {
      const itemWithoutPosition: YouTubeApiResponse<YouTubeApiPlaylistItemResource> = {
        kind: "youtube#playlistItemListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#playlistItem",
            etag: "test-etag",
            id: "playlist-item-id-3",
            snippet: {},
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(itemWithoutPosition));

      const result = await getPlaylistItems("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual([
        {
          id: "playlist-item-id-3",
          videoId: "",
          title: "",
          description: "",
          thumbnails: {},
          publishedAt: "",
          channelId: "",
          channelTitle: "",
          playlistId: "",
          position: 0,
        } satisfies PlaylistItem,
      ]);
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("Playlist Items API Error")));

      const result = await getPlaylistItems("test-playlist-id", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Playlist Items API Error"),
      );
    });
  });
});
