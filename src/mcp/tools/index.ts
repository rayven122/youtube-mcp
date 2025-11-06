import { handleChannelTool } from "./channels.js";
import { handleCommentTool } from "./comments.js";
import { handlePlaylistTool } from "./playlists.js";
import { handleTranscriptTool } from "./transcripts.js";
import { handleVideoTool } from "./videos.js";

// Export all tool handlers as a single object
export const mcpTools = {
  handleVideoTool,
  handleChannelTool,
  handlePlaylistTool,
  handleCommentTool,
  handleTranscriptTool,
};
