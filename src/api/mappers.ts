import type {
  ChannelDetails,
  Comment,
  CommentThread,
  PlaylistDetails,
  PlaylistItem,
  SearchResult,
  TranscriptMetadata,
  VideoDetails,
  YouTubeApiCaptionItem,
  YouTubeApiChannelItem,
  YouTubeApiCommentItem,
  YouTubeApiCommentThreadItem,
  YouTubeApiPlaylistItem,
  YouTubeApiPlaylistItemResource,
  YouTubeApiSearchItem,
  YouTubeApiVideoItem,
} from "@/api/types.js";

export const mapVideoResponse = (item: YouTubeApiVideoItem): VideoDetails => ({
  id: item.id,
  title: item.snippet?.title ?? "",
  description: item.snippet?.description ?? "",
  channelId: item.snippet?.channelId ?? "",
  channelTitle: item.snippet?.channelTitle ?? "",
  publishedAt: item.snippet?.publishedAt ?? "",
  duration: item.contentDetails?.duration ?? "",
  viewCount: item.statistics?.viewCount ?? "0",
  likeCount: item.statistics?.likeCount ?? "0",
  commentCount: item.statistics?.commentCount ?? "0",
  thumbnails: item.snippet?.thumbnails ?? {},
  tags: item.snippet?.tags ?? [],
  categoryId: item.snippet?.categoryId ?? "",
});

export const mapChannelResponse = (item: YouTubeApiChannelItem): ChannelDetails => ({
  id: item.id,
  title: item.snippet?.title ?? "",
  description: item.snippet?.description ?? "",
  customUrl: item.snippet?.customUrl,
  publishedAt: item.snippet?.publishedAt ?? "",
  thumbnails: item.snippet?.thumbnails ?? {},
  viewCount: item.statistics?.viewCount ?? "0",
  subscriberCount: item.statistics?.subscriberCount ?? "0",
  videoCount: item.statistics?.videoCount ?? "0",
  uploads: item.contentDetails?.relatedPlaylists?.uploads,
});

export const mapPlaylistResponse = (item: YouTubeApiPlaylistItem): PlaylistDetails => ({
  id: item.id,
  title: item.snippet?.title ?? "",
  description: item.snippet?.description ?? "",
  channelId: item.snippet?.channelId ?? "",
  channelTitle: item.snippet?.channelTitle ?? "",
  publishedAt: item.snippet?.publishedAt ?? "",
  thumbnails: item.snippet?.thumbnails ?? {},
  privacy: item.status?.privacyStatus ?? "public",
  itemCount: item.contentDetails?.itemCount ?? 0,
});

export const mapPlaylistItem = (item: YouTubeApiPlaylistItemResource): PlaylistItem => ({
  id: item.id,
  title: item.snippet?.title ?? "",
  description: item.snippet?.description ?? "",
  videoId: item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? "",
  channelId: item.snippet?.channelId ?? "",
  channelTitle: item.snippet?.channelTitle ?? "",
  playlistId: item.snippet?.playlistId ?? "",
  position: item.snippet?.position ?? 0,
  publishedAt: item.snippet?.publishedAt ?? "",
  thumbnails: item.snippet?.thumbnails ?? {},
});

export const mapSearchResult = (item: YouTubeApiSearchItem): SearchResult => {
  if (typeof item.id === "string") {
    return {
      id: item.id,
      title: item.snippet?.title ?? "",
      description: item.snippet?.description ?? "",
      channelId: item.snippet?.channelId ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
      thumbnails: item.snippet?.thumbnails ?? {},
      type: "video",
    };
  }

  const idObj = item.id as {
    kind?: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };

  let type: "video" | "channel" | "playlist" = "video";
  if (idObj.kind) {
    const kindType = idObj.kind.split("#")[1];
    if (kindType === "channel") {
      type = "channel";
    } else if (kindType === "playlist") {
      type = "playlist";
    } else {
      type = "video";
    }
  }

  return {
    id: idObj.videoId ?? idObj.channelId ?? idObj.playlistId ?? "",
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    channelId: item.snippet?.channelId ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    publishedAt: item.snippet?.publishedAt ?? "",
    thumbnails: item.snippet?.thumbnails ?? {},
    type,
  };
};

export const mapCommentThreadResponse = (
  item: YouTubeApiCommentThreadItem,
): CommentThread => ({
  id: item.id,
  videoId: item.snippet?.videoId ?? "",
  topLevelComment: mapCommentResponse({
    id: item.snippet?.topLevelComment?.id ?? "",
    snippet: item.snippet?.topLevelComment?.snippet,
  }),
  totalReplyCount: item.snippet?.totalReplyCount ?? 0,
  isPublic: item.snippet?.isPublic ?? true,
});

export const mapCommentResponse = (item: YouTubeApiCommentItem): Comment => ({
  id: item.id,
  videoId: item.snippet?.videoId ?? "",
  textDisplay: item.snippet?.textDisplay ?? "",
  textOriginal: item.snippet?.textOriginal ?? "",
  authorDisplayName: item.snippet?.authorDisplayName ?? "",
  authorProfileImageUrl: item.snippet?.authorProfileImageUrl ?? "",
  authorChannelUrl: item.snippet?.authorChannelUrl ?? "",
  authorChannelId: item.snippet?.authorChannelId?.value ?? "",
  likeCount: item.snippet?.likeCount ?? 0,
  publishedAt: item.snippet?.publishedAt ?? "",
  updatedAt: item.snippet?.updatedAt ?? "",
  parentId: item.snippet?.parentId,
});

export const mapCaptionResponse = (item: YouTubeApiCaptionItem): TranscriptMetadata => ({
  language: item.snippet?.language ?? "",
  name: item.snippet?.name ?? "",
  isAutoGenerated: item.snippet?.isAutoSynced ?? false,
});
