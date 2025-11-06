import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { Result } from "neverthrow";
import { YouTubeApiError } from "@/api/errors/index.js";
import { NetworkError } from "@/lib/errors/index.js";
import { err, ok } from "neverthrow";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export const fetchApi = async <T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  apiKey: YoutubeApiKey,
): Promise<Result<T, YouTubeApiError | NetworkError>> => {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.append("key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = response.statusText || "Unknown error";
      }
      return err(
        new YouTubeApiError(
          `YouTube API Error: ${errorText}`,
          response.status,
          errorText,
        ),
      );
    }

    const data = (await response.json()) as T;
    return ok(data);
  } catch (error) {
    return err(
      new NetworkError(
        `Network error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        error,
      ),
    );
  }
};
