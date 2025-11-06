import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getChannel, getChannelVideos } from "@/api/channels/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { handleChannelTool } from "@/mcp/tools/channels.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// channelsAPIをモック化
vi.mock("@/api/channels/index.js", () => ({
  getChannel: vi.fn(),
  getChannelVideos: vi.fn(),
}));

const mockGetChannel = vi.mocked(getChannel);
const mockGetChannelVideos = vi.mocked(getChannelVideos);
const mockApiKey = "test-api-key" as YoutubeApiKey;

describe("handleChannelTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get_channel", () => {
    const mockChannelData = {
      id: "test-channel-id",
      title: "テストチャンネル",
      description: "テストチャンネルの説明",
      customUrl: "@testchannel",
      publishedAt: "2020-01-01T00:00:00Z",
      thumbnails: {},
      viewCount: "10000",
      subscriberCount: "1000",
      videoCount: "100",
    };

    test("正常系: チャンネル情報を取得して正しいレスポンスを返す", async () => {
      mockGetChannel.mockResolvedValueOnce(ok(mockChannelData));

      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockChannelData),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockGetChannel).toHaveBeenCalledWith("test-channel-id", mockApiKey);
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetChannel.mockResolvedValueOnce(err(new Error("Channel API Error")));

      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Channel API Error"));
    });
  });

  describe("get_channel_videos", () => {
    const mockChannelVideos = [
      {
        id: "channel-video-id",
        title: "チャンネル動画",
        description: "チャンネル動画の説明",
        channelId: "test-channel-id",
        channelTitle: "テストチャンネル",
        publishedAt: "2023-01-01T00:00:00Z",
        thumbnails: {},
        type: "video" as const,
      },
    ];

    test("正常系: デフォルトパラメータでチャンネル動画を取得する", async () => {
      mockGetChannelVideos.mockResolvedValueOnce(ok(mockChannelVideos));

      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toStrictEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(mockChannelVideos),
            },
          ],
        } satisfies CallToolResult);
      }
      expect(mockGetChannelVideos).toHaveBeenCalledWith(
        "test-channel-id",
        mockApiKey,
        10,
        "date",
      );
    });

    test("正常系: カスタムパラメータでチャンネル動画を取得する", async () => {
      mockGetChannelVideos.mockResolvedValueOnce(ok(mockChannelVideos));

      await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
        {
          channelId: "test-channel-id",
          maxResults: 20,
          order: "viewCount",
        },
        mockApiKey,
      );

      expect(mockGetChannelVideos).toHaveBeenCalledWith(
        "test-channel-id",
        mockApiKey,
        20,
        "viewCount",
      );
    });

    test("異常系: 不正な引数の場合にエラーを返す", async () => {
      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
        { invalidParam: "invalid" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(expect.any(Error));
    });

    test("異常系: API呼び出しが失敗した場合にエラーを返す", async () => {
      mockGetChannelVideos.mockResolvedValueOnce(
        err(new Error("Channel Videos API Error")),
      );

      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Channel Videos API Error"),
      );
    });
  });

  describe("unknown tool", () => {
    test("異常系: 不明なツール名の場合にエラーを返す", async () => {
      const result = await handleChannelTool("unknown_tool", {}, mockApiKey);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(
        new Error("Unknown tool: unknown_tool"),
      );
    });
  });

  describe("exception handling", () => {
    test("異常系: 予期しない例外が発生した場合にエラーを返す", async () => {
      mockGetChannel.mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("Unexpected error"));
    });

    test("異常系: 非Errorオブジェクトが投げられた場合に文字列化してエラーを返す", async () => {
      mockGetChannel.mockRejectedValueOnce("string error");

      const result = await handleChannelTool(
        YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
        { channelId: "test-channel-id" },
        mockApiKey,
      );

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("string error"));
    });
  });
});
