import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { z } from "zod";

/**
 * YouTube API Key validation schema with brand
 *
 * Prevents accidental type confusion by creating a nominal type using Zod's brand feature.
 *
 * @see https://zod.dev/?id=brand
 */
const YoutubeApiKeySchema = z
  .string({ required_error: "API key is required" })
  .trim()
  .min(1, "API key is required")
  .brand<"YoutubeApiKey">();

/**
 * Branded Type for YouTube API Key
 */
export type YoutubeApiKey = z.infer<typeof YoutubeApiKeySchema>;

/**
 * Gets YouTube API key from environment variables and validates it
 */
export const getApiKeyFromEnv = (
  env: NodeJS.ProcessEnv,
): Result<YoutubeApiKey, Error> => {
  const result = YoutubeApiKeySchema.safeParse(env.YOUTUBE_API_KEY);

  if (!result.success) {
    return err(new Error(result.error.errors[0]?.message ?? "Invalid API key"));
  }

  return ok(result.data);
};
