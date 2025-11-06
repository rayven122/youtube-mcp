import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "neverthrow";
import { getCommentReplies, getCommentThreads } from "@/api/comments/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { GetCommentRepliesSchema, GetCommentThreadsSchema } from "@/mcp/types.js";
import { err, ok } from "neverthrow";

export const commentTools: Tool[] = [
  {
    name: YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS,
    description: "YouTube動画のコメントスレッドを取得します",
    inputSchema: {
      type: "object",
      properties: {
        videoId: {
          type: "string",
          description: "YouTube動画のID",
        },
        maxResults: {
          type: "number",
          description: "最大取得件数（1-100）",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
        pageToken: {
          type: "string",
          description: "ページネーショントークン",
        },
        order: {
          type: "string",
          enum: ["relevance", "time"],
          description: "並び順（relevance: 関連性順, time: 投稿時刻順）",
          default: "relevance",
        },
      },
      required: ["videoId"],
    },
  },
  {
    name: YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES,
    description: "コメントスレッドへの返信を取得します",
    inputSchema: {
      type: "object",
      properties: {
        parentId: {
          type: "string",
          description: "親コメントのID",
        },
        maxResults: {
          type: "number",
          description: "最大取得件数（1-100）",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
        pageToken: {
          type: "string",
          description: "ページネーショントークン",
        },
      },
      required: ["parentId"],
    },
  },
];

export const handleCommentTool = async (
  toolName: string,
  args: unknown,
  apiKey: YoutubeApiKey,
): Promise<Result<CallToolResult, Error>> => {
  try {
    switch (toolName) {
      case YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS: {
        const input = GetCommentThreadsSchema.parse(args);
        const result = await getCommentThreads(
          input.videoId,
          apiKey,
          input.maxResults,
          input.pageToken,
          input.order,
        );
        if (result.isErr()) {
          return err(result.error);
        }
        return ok({
          content: [{ type: "text", text: JSON.stringify(result.value) }],
        });
      }
      case YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES: {
        const input = GetCommentRepliesSchema.parse(args);
        const result = await getCommentReplies(
          input.parentId,
          apiKey,
          input.maxResults,
          input.pageToken,
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
