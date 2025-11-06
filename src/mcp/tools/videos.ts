import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "neverthrow";
import { getVideo, searchVideos } from "@/api/videos/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { GetVideoSchema, SearchVideosSchema } from "@/mcp/types.js";
import { err, ok } from "neverthrow";

export const videoTools: Tool[] = [
  {
    name: YOU_TUBE_TOOL_NAMES.GET_VIDEO,
    description: "YouTube動画の詳細情報を取得します",
    inputSchema: {
      type: "object",
      properties: {
        videoId: {
          type: "string",
          description: "YouTube動画のID",
        },
        parts: {
          type: "array",
          items: {
            type: "string",
            enum: ["snippet", "statistics", "contentDetails"],
          },
          description: "取得する情報の種類",
        },
      },
      required: ["videoId"],
    },
  },
  {
    name: YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS,
    description: "YouTube動画を検索します",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "検索クエリ",
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
          enum: ["relevance", "date", "rating", "viewCount", "title"],
          description: "並び順",
          default: "relevance",
        },
        type: {
          type: "string",
          enum: ["video", "channel", "playlist"],
          description: "検索対象のタイプ",
          default: "video",
        },
      },
      required: ["query"],
    },
  },
];

export const handleVideoTool = async (
  toolName: string,
  args: unknown,
  apiKey: YoutubeApiKey,
): Promise<Result<CallToolResult, Error>> => {
  try {
    switch (toolName) {
      case YOU_TUBE_TOOL_NAMES.GET_VIDEO: {
        const input = GetVideoSchema.parse(args);
        const result = await getVideo(input.videoId, apiKey, input.parts);
        if (result.isErr()) {
          return err(result.error);
        }
        return ok({
          content: [{ type: "text", text: JSON.stringify(result.value) }],
        });
      }
      case YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS: {
        const input = SearchVideosSchema.parse(args);
        const result = await searchVideos(
          input.query,
          apiKey,
          input.maxResults,
          input.order,
          input.type,
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
