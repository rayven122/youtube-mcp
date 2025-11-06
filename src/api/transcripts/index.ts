import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { TranscriptMetadata, YouTubeApiCaptionItem } from "@/api/types.js";
import type { Result } from "neverthrow";
import { fetchApi } from "@/api/fetcher.js";
import { mapCaptionResponse } from "@/api/mappers.js";

export const getTranscriptMetadata = async (
  videoId: string,
  apiKey: YoutubeApiKey,
): Promise<Result<TranscriptMetadata[], Error>> => {
  const result = await fetchApi<{
    items?: YouTubeApiCaptionItem[];
  }>(
    "captions",
    {
      part: "snippet",
      videoId,
    },
    apiKey,
  );

  return result.map((data) => {
    if (!data.items) {
      return [];
    }
    return data.items.map(mapCaptionResponse);
  });
};
