/**
 * YouTube Data API v3 Type Definitions
 *
 * API Reference:
 * - Videos: https://developers.google.com/youtube/v3/docs/videos
 * - Channels: https://developers.google.com/youtube/v3/docs/channels
 * - Playlists: https://developers.google.com/youtube/v3/docs/playlists
 * - PlaylistItems: https://developers.google.com/youtube/v3/docs/playlistItems
 * - Search: https://developers.google.com/youtube/v3/docs/search
 * - CommentThreads: https://developers.google.com/youtube/v3/docs/commentThreads
 * - Comments: https://developers.google.com/youtube/v3/docs/comments
 * - Captions: https://developers.google.com/youtube/v3/docs/captions
 *
 * Response Schema Reference:
 * - API Response Structure: https://developers.google.com/youtube/v3/docs#resource-types
 * - Error Response: https://developers.google.com/youtube/v3/docs/errors
 */

// ===== API Response Types =====

export type YouTubeApiVideoItem = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
    tags?: string[];
    categoryId?: string;
    liveBroadcastContent?: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    favoriteCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration?: string;
    dimension?: string;
    definition?: string;
    caption?: string;
    licensedContent?: boolean;
    contentRating?: Record<string, string>;
    projection?: string;
  };
};

export type YouTubeApiChannelItem = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
    country?: string;
  };
  statistics?: {
    viewCount?: string;
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      likes?: string;
      uploads?: string;
    };
  };
};

export type YouTubeApiPlaylistItem = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
    tags?: string[];
    defaultLanguage?: string;
  };
  status?: {
    privacyStatus?: string;
  };
  contentDetails?: {
    itemCount?: number;
  };
};

export type YouTubeApiPlaylistItemResource = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
    playlistId?: string;
    position?: number;
    resourceId?: {
      kind?: string;
      videoId?: string;
    };
    videoOwnerChannelTitle?: string;
    videoOwnerChannelId?: string;
  };
  contentDetails?: {
    videoId?: string;
    startAt?: string;
    endAt?: string;
    note?: string;
    videoPublishedAt?: string;
  };
};

export type YouTubeApiSearchItem = {
  kind?: string;
  etag?: string;
  id:
    | string
    | {
        kind?: string;
        videoId?: string;
        channelId?: string;
        playlistId?: string;
      };
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
    channelHandle?: string;
    liveBroadcastContent?: string;
  };
};

export type YouTubeApiCommentThreadItem = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    channelId?: string;
    videoId?: string;
    topLevelComment?: YouTubeApiCommentItem;
    canReply?: boolean;
    totalReplyCount?: number;
    isPublic?: boolean;
  };
  replies?: {
    comments?: YouTubeApiCommentItem[];
  };
};

export type YouTubeApiCommentItem = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    authorDisplayName?: string;
    authorProfileImageUrl?: string;
    authorChannelUrl?: string;
    authorChannelId?: {
      value?: string;
    };
    videoId?: string;
    textDisplay?: string;
    textOriginal?: string;
    parentId?: string;
    canRate?: boolean;
    viewerRating?: string;
    likeCount?: number;
    publishedAt?: string;
    updatedAt?: string;
  };
};

export type YouTubeApiCaptionItem = {
  kind?: string;
  etag?: string;
  id: string;
  snippet?: {
    videoId?: string;
    lastUpdated?: string;
    trackKind?: string;
    language?: string;
    name?: string;
    audioTrackType?: string;
    isCC?: boolean;
    isLarge?: boolean;
    isEasyReader?: boolean;
    isDraft?: boolean;
    isAutoSynced?: boolean;
    status?: string;
    failureReason?: string;
  };
};

export type YouTubeApiResponse<T> = {
  kind?: string;
  etag?: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: {
    totalResults?: number;
    resultsPerPage?: number;
  };
  items?: T[];
};

export type YouTubeApiError = {
  error: {
    code: number;
    message: string;
    errors?: {
      message: string;
      domain: string;
      reason: string;
      location?: string;
      locationType?: string;
    }[];
    status?: string;
  };
};

// ===== Domain Types =====

export type VideoDetails = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
  tags: string[];
  categoryId: string;
};

export type ChannelDetails = {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
  viewCount: string;
  subscriberCount: string;
  videoCount: string;
  uploads?: string;
};

export type PlaylistDetails = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
  itemCount: number;
  privacy: string;
};

export type PlaylistItem = {
  id: string;
  title: string;
  description: string;
  videoId: string;
  channelId: string;
  channelTitle: string;
  playlistId: string;
  position: number;
  publishedAt: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
};

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
  type: "video" | "channel" | "playlist";
};

export type CommentThread = {
  id: string;
  videoId: string;
  topLevelComment: Comment;
  totalReplyCount: number;
  isPublic: boolean;
};

export type Comment = {
  id: string;
  videoId: string;
  textDisplay: string;
  textOriginal: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl: string;
  authorChannelId: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  parentId?: string;
};

export type TranscriptMetadata = {
  language: string;
  name: string;
  isAutoGenerated: boolean;
};

export type TranscriptSegment = {
  text: string;
  start: number;
  duration: number;
  end: number;
};

export type TranscriptResponse = {
  segments: TranscriptSegment[];
};
