import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "neverthrow";
import { getChannel, getChannelVideos } from "@/api/channels/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { GetChannelSchema, GetChannelVideosSchema } from "@/mcp/types.js";
import { err, ok } from "neverthrow";

export const channelTools: Tool[] = [
  {
    name: YOU_TUBE_TOOL_NAMES.GET_CHANNEL,
    description: "YouTubeチャンネルの詳細情報を取得します",
    inputSchema: {
      type: "object",
      properties: {
        channelId: {
          type: "string",
          description: "YouTubeチャンネルのID",
        },
      },
      required: ["channelId"],
    },
  },
  {
    name: YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS,
    description: "指定したYouTubeチャンネルの動画一覧を取得します",
    inputSchema: {
      type: "object",
      properties: {
        channelId: {
          type: "string",
          description: "YouTubeチャンネルのID",
        },
        maxResults: {
          type: "number",
          description: "最大取得件数（1-50）",
          minimum: 1,
          maximum: 50,
          default: 10,
        },
        order: {
          type: "string",
          enum: ["date", "rating", "viewCount", "title"],
          description: "並び順",
          default: "date",
        },
      },
      required: ["channelId"],
    },
  },
];

export const handleChannelTool = async (
  toolName: string,
  args: unknown,
  apiKey: YoutubeApiKey,
): Promise<Result<CallToolResult, Error>> => {
  try {
    switch (toolName) {
      case YOU_TUBE_TOOL_NAMES.GET_CHANNEL: {
        const input = GetChannelSchema.parse(args);
        const result = await getChannel(input.channelId, apiKey);
        if (result.isErr()) {
          return err(result.error);
        }
        return ok({
          content: [{ type: "text", text: JSON.stringify(result.value) }],
        });
      }
      case YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS: {
        const input = GetChannelVideosSchema.parse(args);
        const result = await getChannelVideos(
          input.channelId,
          apiKey,
          input.maxResults,
          input.order,
        );
        if (result.isErr()) {
          return err(result.error);
        }
        return ok({
          content: [{ type: "text", text: JSON.stringify(result.value) }],
        });
      }
      default:
        return err(new Error(`Unknown tool: ${toolName}`));
    }
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
};
