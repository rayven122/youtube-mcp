import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  ChannelDetails,
  SearchResult,
  YouTubeApiChannelItem,
  YouTubeApiSearchItem,
} from "@/api/types.js";
import type { Result } from "neverthrow";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { mapChannelResponse, mapSearchResult } from "@/api/mappers.js";
import { err } from "neverthrow";

export const getChannel = async (
  channelId: string,
  apiKey: YoutubeApiKey,
): Promise<Result<ChannelDetails, Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiChannelItem[];
  }>(
    "channels",
    {
      id: channelId,
      part: "snippet,statistics",
    },
    apiKey,
  );

  if (result.isErr()) {
    return err(result.error as Error);
  }

  const { items } = result.value;
  if (!items || items.length === 0) {
    return err(new YouTubeApiError(`Channel not found: ${channelId}`));
  }
  const firstItem = items[0];
  if (!firstItem) {
    return err(new YouTubeApiError(`Channel not found: ${channelId}`));
  }

  return result.map(() => mapChannelResponse(firstItem));
};

export const getChannelVideos = async (
  channelId: string,
  apiKey: YoutubeApiKey,
  maxResults = 10,
  order: "date" | "rating" | "viewCount" | "title" = "date",
): Promise<Result<SearchResult[], Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiSearchItem[];
  }>(
    "search",
    {
      channelId,
      part: "snippet",
      maxResults,
      order,
      type: "video",
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
