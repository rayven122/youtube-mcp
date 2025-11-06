import type { YoutubeApiKey } from "@/api/apiKey.js";
import type {
  PlaylistDetails,
  PlaylistItem,
  YouTubeApiPlaylistItem,
  YouTubeApiPlaylistItemResource,
} from "@/api/types.js";
import type { Result } from "neverthrow";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { mapPlaylistItem, mapPlaylistResponse } from "@/api/mappers.js";
import { err } from "neverthrow";

export const getPlaylist = async (
  playlistId: string,
  apiKey: YoutubeApiKey,
): Promise<Result<PlaylistDetails, Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiPlaylistItem[];
  }>(
    "playlists",
    {
      id: playlistId,
      part: "snippet,contentDetails",
    },
    apiKey,
  );

  if (result.isErr()) {
    return err(result.error as Error);
  }

  const { items } = result.value;
  if (!items || items.length === 0) {
    return err(new YouTubeApiError(`Playlist not found: ${playlistId}`));
  }
  const firstItem = items[0];
  if (!firstItem) {
    return err(new YouTubeApiError(`Playlist not found: ${playlistId}`));
  }

  return result.map(() => mapPlaylistResponse(firstItem));
};

export const getPlaylistItems = async (
  playlistId: string,
  apiKey: YoutubeApiKey,
  maxResults = 10,
): Promise<Result<PlaylistItem[], Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiPlaylistItemResource[];
  }>(
    "playlistItems",
    {
      playlistId,
      part: "snippet,contentDetails",
      maxResults,
    },
    apiKey,
  );

  return result.map((data) => {
    if (!data.items) {
      return [];
    }
    return data.items.map(mapPlaylistItem);
  });
};
