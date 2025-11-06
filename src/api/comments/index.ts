import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  Comment,
  CommentThread,
  YouTubeApiCommentItem,
  YouTubeApiCommentThreadItem,
} from "@/api/types.js";
import type { Result } from "neverthrow";
import { fetchApi } from "@/api/fetcher.js";
import { mapCommentResponse, mapCommentThreadResponse } from "@/api/mappers.js";

export const getCommentThreads = async (
  videoId: string,
  apiKey: YoutubeApiKey,
  maxResults = 20,
  pageToken?: string,
  order: "relevance" | "time" = "relevance",
): Promise<
  Result<
    {
      items: CommentThread[];
      nextPageToken?: string;
    },
    Error
  >
> => {
  const result = await fetchApi<{
    items?: YouTubeApiCommentThreadItem[];
    nextPageToken?: string;
  }>(
    "commentThreads",
    {
      part: "snippet",
      videoId,
      maxResults,
      order,
      pageToken,
    },
    apiKey,
  );

  return result.map((data) => {
    if (!data.items) {
      return {
        items: [],
        nextPageToken: data.nextPageToken,
      };
    }
    return {
      items: data.items.map(mapCommentThreadResponse),
      nextPageToken: data.nextPageToken,
    };
  });
};

export const getCommentReplies = async (
  parentId: string,
  apiKey: YoutubeApiKey,
  maxResults = 20,
  pageToken?: string,
): Promise<
  Result<
    {
      items: Comment[];
      nextPageToken?: string;
    },
    Error
  >
> => {
  const result = await fetchApi<{
    items?: YouTubeApiCommentItem[];
    nextPageToken?: string;
  }>(
    "comments",
    {
      part: "snippet",
      parentId,
      maxResults,
      pageToken,
    },
    apiKey,
  );

  return result.map((data) => {
    if (!data.items) {
      return {
        items: [],
        nextPageToken: data.nextPageToken,
      };
    }
    return {
      items: data.items.map(mapCommentResponse),
      nextPageToken: data.nextPageToken,
    };
  });
};
