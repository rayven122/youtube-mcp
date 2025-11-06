// YouTube APIの統合エクスポート

import { getApiKeyFromEnv } from "@/api/apiKey.js";

import { getChannel, getChannelVideos } from "./channels/index.js";
import { getCommentReplies, getCommentThreads } from "./comments/index.js";
import { getPlaylist, getPlaylistItems } from "./playlists/index.js";
import { getTranscriptMetadata } from "./transcripts/index.js";
import { getVideo, searchVideos } from "./videos/index.js";

// YouTube APIオブジェクトとしてエクスポート
export const youtubeApi = {
  getApiKeyFromEnv,
  getVideo,
  searchVideos,
  getChannel,
  getChannelVideos,
  getPlaylist,
  getPlaylistItems,
  getCommentThreads,
  getCommentReplies,
  getTranscriptMetadata,
};
