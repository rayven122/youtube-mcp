import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  Comment,
  CommentThread,
  YouTubeApiCommentItem,
  YouTubeApiCommentThreadItem,
  YouTubeApiResponse,
} from "@/api/types.js";
import { getCommentReplies, getCommentThreads } from "@/api/comments/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// fetchApiをモック化
vi.mock("@/api/fetcher.js", () => ({
  fetchApi: vi.fn(),
}));

const mockFetchApi = vi.mocked(fetchApi);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("comments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCommentThreads", () => {
    const mockCommentThreadsResponse: YouTubeApiResponse<YouTubeApiCommentThreadItem> = {
      kind: "youtube#commentThreadListResponse",
      etag: "test-etag",
      nextPageToken: "next-page-token",
      items: [
        {
          kind: "youtube#commentThread",
          etag: "test-etag",
          id: "thread1",
          snippet: {
            videoId: "test-video",
            topLevelComment: {
              kind: "youtube#comment",
              etag: "comment-etag",
              id: "comment1",
              snippet: {
                videoId: "test-video",
                textDisplay: "Test comment",
                textOriginal: "Test comment",
                authorDisplayName: "Test User",
                authorProfileImageUrl: "https://example.com/avatar.jpg",
                authorChannelUrl: "https://youtube.com/c/testuser",
                authorChannelId: {
                  value: "channel123",
                },
                canRate: true,
                viewerRating: "none",
                likeCount: 10,
                publishedAt: "2023-01-01T00:00:00Z",
                updatedAt: "2023-01-01T00:00:00Z",
              },
            },
            canReply: true,
            totalReplyCount: 5,
            isPublic: true,
          },
        },
      ],
    };

    test("正常系: デフォルトパラメータでコメントスレッドを取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockCommentThreadsResponse));

      const result = await getCommentThreads("test-video", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        items: [
          {
            id: "thread1",
            videoId: "test-video",
            topLevelComment: {
              id: "comment1",
              videoId: "test-video",
              textDisplay: "Test comment",
              textOriginal: "Test comment",
              authorDisplayName: "Test User",
              authorProfileImageUrl: "https://example.com/avatar.jpg",
              authorChannelUrl: "https://youtube.com/c/testuser",
              authorChannelId: "channel123",
              likeCount: 10,
              publishedAt: "2023-01-01T00:00:00Z",
              updatedAt: "2023-01-01T00:00:00Z",
              parentId: undefined,
            } satisfies Comment,
            totalReplyCount: 5,
            isPublic: true,
          } satisfies CommentThread,
        ],
        nextPageToken: "next-page-token",
      } satisfies { items: CommentThread[]; nextPageToken?: string });
      expect(mockFetchApi).toHaveBeenCalledWith(
        "commentThreads",
        {
          part: "snippet",
          videoId: "test-video",
          maxResults: 20,
          order: "relevance",
        },
        mockApiKey,
      );
    });

    test("正常系: カスタムパラメータでコメントスレッドを取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockCommentThreadsResponse));

      await getCommentThreads("test-video", mockApiKey, 50, "page-token", "time");

      expect(mockFetchApi).toHaveBeenCalledWith(
        "commentThreads",
        {
          part: "snippet",
          videoId: "test-video",
          maxResults: 50,
          pageToken: "page-token",
          order: "time",
        },
        mockApiKey,
      );
    });

    test("正常系: nextPageTokenがない場合はundefinedを返す", async () => {
      const responseWithoutNextPage = {
        ...mockCommentThreadsResponse,
        nextPageToken: undefined,
      };

      mockFetchApi.mockResolvedValueOnce(ok(responseWithoutNextPage));

      const result = await getCommentThreads("test-video", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        items: [
          {
            id: "thread1",
            videoId: "test-video",
            topLevelComment: {
              id: "comment1",
              videoId: "test-video",
              textDisplay: "Test comment",
              textOriginal: "Test comment",
              authorDisplayName: "Test User",
              authorProfileImageUrl: "https://example.com/avatar.jpg",
              authorChannelUrl: "https://youtube.com/c/testuser",
              authorChannelId: "channel123",
              likeCount: 10,
              publishedAt: "2023-01-01T00:00:00Z",
              updatedAt: "2023-01-01T00:00:00Z",
              parentId: undefined,
            } satisfies Comment,
            totalReplyCount: 5,
            isPublic: true,
          } satisfies CommentThread,
        ],
        nextPageToken: undefined,
      } satisfies { items: CommentThread[]; nextPageToken?: string });
    });

    test("正常系: コメントデータが部分的に欠けている場合にデフォルト値でマップされる", async () => {
      const incompleteResponse: YouTubeApiResponse<YouTubeApiCommentThreadItem> = {
        kind: "youtube#commentThreadListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#commentThread",
            etag: "test-etag",
            id: "thread1",
            snippet: {
              topLevelComment: {
                kind: "youtube#comment",
                etag: "comment-etag",
                id: "comment1",
                snippet: {},
              },
            },
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(incompleteResponse));

      const result = await getCommentThreads("test-video", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        items: [
          {
            id: "thread1",
            videoId: "",
            topLevelComment: {
              id: "comment1",
              videoId: "",
              textDisplay: "",
              textOriginal: "",
              authorDisplayName: "",
              authorProfileImageUrl: "",
              authorChannelUrl: "",
              authorChannelId: "",
              likeCount: 0,
              publishedAt: "",
              updatedAt: "",
              parentId: undefined,
            } satisfies Comment,
            totalReplyCount: 0,
            isPublic: true,
          } satisfies CommentThread,
        ],
        nextPageToken: undefined,
      } satisfies { items: CommentThread[]; nextPageToken?: string });
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("Comment Threads API Error")));

      const result = await getCommentThreads("test-video", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Comment Threads API Error"),
      );
    });
  });

  describe("getCommentReplies", () => {
    const mockCommentRepliesResponse: YouTubeApiResponse<YouTubeApiCommentItem> = {
      kind: "youtube#commentListResponse",
      etag: "test-etag",
      nextPageToken: "replies-next-token",
      items: [
        {
          kind: "youtube#comment",
          etag: "reply-etag",
          id: "reply1",
          snippet: {
            parentId: "parent-comment-id",
            textDisplay: "Reply comment",
            textOriginal: "Reply comment",
            authorDisplayName: "Reply User",
            authorProfileImageUrl: "https://example.com/reply-avatar.jpg",
            authorChannelUrl: "https://youtube.com/c/replyuser",
            authorChannelId: {
              value: "replychannel123",
            },
            canRate: true,
            viewerRating: "none",
            likeCount: 5,
            publishedAt: "2023-01-02T00:00:00Z",
            updatedAt: "2023-01-02T00:00:00Z",
          },
        },
      ],
    };

    test("正常系: デフォルトパラメータでコメント返信を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockCommentRepliesResponse));

      const result = await getCommentReplies("parent-comment-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        items: [
          {
            id: "reply1",
            videoId: "",
            textDisplay: "Reply comment",
            textOriginal: "Reply comment",
            authorDisplayName: "Reply User",
            authorProfileImageUrl: "https://example.com/reply-avatar.jpg",
            authorChannelUrl: "https://youtube.com/c/replyuser",
            authorChannelId: "replychannel123",
            likeCount: 5,
            publishedAt: "2023-01-02T00:00:00Z",
            updatedAt: "2023-01-02T00:00:00Z",
            parentId: "parent-comment-id",
          } satisfies Comment,
        ],
        nextPageToken: "replies-next-token",
      } satisfies { items: Comment[]; nextPageToken?: string });
      expect(mockFetchApi).toHaveBeenCalledWith(
        "comments",
        {
          part: "snippet",
          parentId: "parent-comment-id",
          maxResults: 20,
        },
        mockApiKey,
      );
    });

    test("正常系: カスタムパラメータでコメント返信を取得する", async () => {
      mockFetchApi.mockResolvedValueOnce(ok(mockCommentRepliesResponse));

      await getCommentReplies("parent-comment-id", mockApiKey, 50, "replies-page-token");

      expect(mockFetchApi).toHaveBeenCalledWith(
        "comments",
        {
          part: "snippet",
          parentId: "parent-comment-id",
          maxResults: 50,
          pageToken: "replies-page-token",
        },
        mockApiKey,
      );
    });

    test("正常系: nextPageTokenがない場合はundefinedを返す", async () => {
      const responseWithoutNextPage = {
        ...mockCommentRepliesResponse,
        nextPageToken: undefined,
      };

      mockFetchApi.mockResolvedValueOnce(ok(responseWithoutNextPage));

      const result = await getCommentReplies("parent-comment-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        items: [
          {
            id: "reply1",
            videoId: "",
            textDisplay: "Reply comment",
            textOriginal: "Reply comment",
            authorDisplayName: "Reply User",
            authorProfileImageUrl: "https://example.com/reply-avatar.jpg",
            authorChannelUrl: "https://youtube.com/c/replyuser",
            authorChannelId: "replychannel123",
            likeCount: 5,
            publishedAt: "2023-01-02T00:00:00Z",
            updatedAt: "2023-01-02T00:00:00Z",
            parentId: "parent-comment-id",
          } satisfies Comment,
        ],
        nextPageToken: undefined,
      } satisfies { items: Comment[]; nextPageToken?: string });
    });

    test("正常系: 返信データが部分的に欠けている場合にデフォルト値でマップされる", async () => {
      const incompleteResponse: YouTubeApiResponse<YouTubeApiCommentItem> = {
        kind: "youtube#commentListResponse",
        etag: "test-etag",
        items: [
          {
            kind: "youtube#comment",
            etag: "reply-etag",
            id: "reply1",
            snippet: {},
          },
        ],
      };

      mockFetchApi.mockResolvedValueOnce(ok(incompleteResponse));

      const result = await getCommentReplies("parent-comment-id", mockApiKey);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual({
        items: [
          {
            id: "reply1",
            videoId: "",
            textDisplay: "",
            textOriginal: "",
            authorDisplayName: "",
            authorProfileImageUrl: "",
            authorChannelUrl: "",
            authorChannelId: "",
            likeCount: 0,
            publishedAt: "",
            updatedAt: "",
            parentId: undefined,
          } satisfies Comment,
        ],
        nextPageToken: undefined,
      } satisfies { items: Comment[]; nextPageToken?: string });
    });

    test("異常系: fetchエラーの場合にエラーを返す", async () => {
      mockFetchApi.mockResolvedValueOnce(err(new Error("Comment Replies API Error")));

      const result = await getCommentReplies("parent-comment-id", mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Comment Replies API Error"),
      );
    });
  });
});
