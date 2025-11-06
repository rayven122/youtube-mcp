import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "neverthrow";
import { getPlaylist, getPlaylistItems } from "@/api/playlists/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { GetPlaylistItemsSchema, GetPlaylistSchema } from "@/mcp/types.js";
import { err, ok } from "neverthrow";

export const playlistTools: Tool[] = [
  {
    name: YOU_TUBE_TOOL_NAMES.GET_PLAYLIST,
    description: "YouTubeプレイリストの詳細情報を取得します",
    inputSchema: {
      type: "object",
      properties: {
        playlistId: {
          type: "string",
          description: "YouTubeプレイリストのID",
        },
      },
      required: ["playlistId"],
    },
  },
  {
    name: YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS,
    description: "YouTubeプレイリスト内の動画一覧を取得します",
    inputSchema: {
      type: "object",
      properties: {
        playlistId: {
          type: "string",
          description: "YouTubeプレイリストのID",
        },
        maxResults: {
          type: "number",
          description: "最大取得件数（1-50）",
          minimum: 1,
          maximum: 50,
          default: 10,
        },
      },
      required: ["playlistId"],
    },
  },
];

export const handlePlaylistTool = async (
  toolName: string,
  args: unknown,
  apiKey: YoutubeApiKey,
): Promise<Result<CallToolResult, Error>> => {
  try {
    switch (toolName) {
      case YOU_TUBE_TOOL_NAMES.GET_PLAYLIST: {
        const input = GetPlaylistSchema.parse(args);
        const result = await getPlaylist(input.playlistId, apiKey);
        if (result.isErr()) {
          return err(result.error);
        }
        return ok({
          content: [{ type: "text", text: JSON.stringify(result.value) }],
        });
      }
      case YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS: {
        const input = GetPlaylistItemsSchema.parse(args);
        const result = await getPlaylistItems(input.playlistId, apiKey, input.maxResults);
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
