import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  SearchResult,
  VideoDetails,
  YouTubeApiSearchItem,
  YouTubeApiVideoItem,
} from "@/api/types.js";
import type { Result } from "neverthrow";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { mapSearchResult, mapVideoResponse } from "@/api/mappers.js";
import { err } from "neverthrow";

export const getVideo = async (
  videoId: string,
  apiKey: YoutubeApiKey,
  parts: string[] = ["snippet", "statistics", "contentDetails"],
): Promise<Result<VideoDetails, Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiVideoItem[];
  }>(
    "videos",
    {
      id: videoId,
      part: parts.join(","),
    },
    apiKey,
  );

  if (result.isErr()) {
    return err(result.error as Error);
  }

  const { items } = result.value;
  if (!items || items.length === 0) {
    return err(new YouTubeApiError(`Video not found: ${videoId}`));
  }
  const firstItem = items[0];
  if (!firstItem) {
    return err(new YouTubeApiError(`Video not found: ${videoId}`));
  }

  return result.map(() => mapVideoResponse(firstItem));
};

export const searchVideos = async (
  query: string,
  apiKey: YoutubeApiKey,
  maxResults = 10,
  order: "relevance" | "date" | "rating" | "viewCount" | "title" = "relevance",
  type: "video" | "channel" | "playlist" = "video",
): Promise<Result<SearchResult[], Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiSearchItem[];
  }>(
    "search",
    {
      q: query,
      part: "snippet",
      maxResults,
      order,
      type,
    },
    apiKey,
  );

  return result.map((data) => {
    if (!data.items) {
      return [];
    }
    return data.items.map(mapSearchResult);
  });
};
