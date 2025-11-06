import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "neverthrow";
import { err } from "neverthrow";

import { YOU_TUBE_TOOL_NAMES } from "./constants.js";
import { handleChannelTool } from "./tools/channels.js";
import { handleCommentTool } from "./tools/comments.js";
import { handlePlaylistTool } from "./tools/playlists.js";
import { handleTranscriptTool } from "./tools/transcripts.js";
import { handleVideoTool } from "./tools/videos.js";

/**
 * MCPツールのリクエストハンドラー
 */
export const handleToolRequest = async (
  toolName: string,
  args: unknown,
  apiKey: YoutubeApiKey,
): Promise<Result<CallToolResult, Error>> => {
  switch (toolName) {
    // Videos
    case YOU_TUBE_TOOL_NAMES.GET_VIDEO:
    case YOU_TUBE_TOOL_NAMES.SEARCH_VIDEOS:
      return handleVideoTool(toolName, args, apiKey);

    // Channels
    case YOU_TUBE_TOOL_NAMES.GET_CHANNEL:
    case YOU_TUBE_TOOL_NAMES.GET_CHANNEL_VIDEOS:
      return handleChannelTool(toolName, args, apiKey);

    // Playlists
    case YOU_TUBE_TOOL_NAMES.GET_PLAYLIST:
    case YOU_TUBE_TOOL_NAMES.GET_PLAYLIST_ITEMS:
      return handlePlaylistTool(toolName, args, apiKey);

    // Comments
    case YOU_TUBE_TOOL_NAMES.GET_COMMENT_THREADS:
    case YOU_TUBE_TOOL_NAMES.GET_COMMENT_REPLIES:
      return handleCommentTool(toolName, args, apiKey);

    // Transcripts
    case YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT_METADATA:
    case YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT:
      return handleTranscriptTool(toolName, args, apiKey);

    default:
      return err(new Error(`Unknown tool: ${toolName}`));
  }
};
