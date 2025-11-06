import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getCommentReplies, getCommentThreads } from "@/api/comments/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { handleCommentTool } from "@/mcp/tools/comments.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// commentsAPIをモック化
vi.mock("@/api/comments/index.js", () => ({
  getCommentThreads: vi.fn(),
  getCommentReplies: vi.fn(),
}));

const mockGetCommentThreads = vi.mocked(getCommentThreads);
const mockGetCommentReplies = vi.mocked(getCommentReplies);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("handleCommentTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get_comment_threads", () => {
    const mockCommentThreadsData = {
      items: [
        {
          id: "thread1",
          videoId: "test-video-id",
          topLevelComment: {
            id: "comment1",
            videoId: "test-video-id",
            textDisplay: "Test comment",
            textOriginal: "Test comment",
            authorDisplayName: "Test User",
            authorProfileImageUrl: "https://example.com/avatar.jpg",
            authorChannelUrl: "https://youtube.com/c/testuser",
            authorChannelId: "channel123",
            canRate: true,
            viewerRating: "none",
            likeCount: 10,
            publishedAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
          },
          totalReplyCount: 5,
          isPublic: true,
        },
      ],
      nextPageToken: "next-page-token",
    };

    test("正常系: デフォルトパラメータでコメントスレッドを取得する", async () => {
      mockGetCommentThreads.mockResolvedValueOnce(ok(mockCommentThreadsData));

      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockCommentThreadsData),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockGetCommentThreads).toHaveBeenCalledWith(
        "test-video-id",
        mockApiKey,
        20,
        undefined,
        "relevance",
      );
    });

    test("正常系: カスタムパラメータでコメントスレッドを取得する", async () => {
      mockGetCommentThreads.mockResolvedValueOnce(ok(mockCommentThreadsData));

      await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        {
          videoId: "test-video-id",
          maxResults: 50,
          pageToken: "page-token",
          order: "time",
        },
        mockApiKey,
      );

      expect(mockGetCommentThreads).toHaveBeenCalledWith(
        "test-video-id",
        mockApiKey,
        50,
        "page-token",
        "time",
      );
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetCommentThreads.mockResolvedValueOnce(
        err(new Error("Comment Threads API Error")),
      );

      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Comment Threads API Error"),
      );
    });
  });

  describe("get_comment_replies", () => {
    const mockCommentRepliesData = {
      items: [
        {
          id: "reply1",
          videoId: "test-video-id",
          textDisplay: "Reply comment",
          textOriginal: "Reply comment",
          authorDisplayName: "Reply User",
          authorProfileImageUrl: "https://example.com/reply-avatar.jpg",
          authorChannelUrl: "https://youtube.com/c/replyuser",
          authorChannelId: "replychannel123",
          canRate: true,
          viewerRating: "none",
          likeCount: 5,
          publishedAt: "2023-01-02T00:00:00Z",
          updatedAt: "2023-01-02T00:00:00Z",
          parentId: "parent-comment-id",
        },
      ],
      nextPageToken: "replies-next-token",
    };

    test("正常系: デフォルトパラメータでコメント返信を取得する", async () => {
      mockGetCommentReplies.mockResolvedValueOnce(ok(mockCommentRepliesData));

      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
        { parentId: "parent-comment-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockCommentRepliesData),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockGetCommentReplies).toHaveBeenCalledWith(
        "parent-comment-id",
        mockApiKey,
        20,
        undefined,
      );
    });

    test("正常系: カスタムパラメータでコメント返信を取得する", async () => {
      mockGetCommentReplies.mockResolvedValueOnce(ok(mockCommentRepliesData));

      await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
        {
          parentId: "parent-comment-id",
          maxResults: 50,
          pageToken: "replies-page-token",
        },
        mockApiKey,
      );

      expect(mockGetCommentReplies).toHaveBeenCalledWith(
        "parent-comment-id",
        mockApiKey,
        50,
        "replies-page-token",
      );
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetCommentReplies.mockResolvedValueOnce(
        err(new Error("Comment Replies API Error")),
      );

      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
        { parentId: "parent-comment-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Comment Replies API Error"),
      );
    });
  });

  describe("unknown tool", () => {
    test("異常系: 不明なツール名の場合にエラーを返す", async () => {
      const result = await handleCommentTool("unknown_tool", {}, mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Unknown tool: unknown_tool"),
      );
    });
  });

  describe("exception handling", () => {
    test("異常系: 予期しない例外が発生した場合にエラーを返す", async () => {
      mockGetCommentThreads.mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Unexpected error"));
    });

    test("異常系: 非Errorオブジェクトが投げられた場合に文字列化してエラーを返す", async () => {
      mockGetCommentThreads.mockRejectedValueOnce("string error");

      const result = await handleCommentTool(
        YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
        { videoId: "test-video-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("string error"));
    });
  });
});
