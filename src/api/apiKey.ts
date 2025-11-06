import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { z } from "zod";

const YoutubeApiKeySchema = z
  .string({ required_error: "API key is required" })
  .trim()
  .min(1, "API key is required");

/**
 * Branded Type for YouTube API Key
 *
 * Prevents accidental type confusion by creating a nominal type.
 * Uses 'unique symbol' to ensure each branded type is distinct.
 *
 * @see https://egghead.io/blog/using-branded-types-in-typescript
 * @see https://typescript-jp.gitbook.io/deep-dive/main-1/nominaltyping
 */
export type YoutubeApiKey = z.infer<typeof YoutubeApiKeySchema> & {
  readonly _brand: unique symbol;
};

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

  // Cast to branded type after validation
  return ok(result.data as YoutubeApiKey);
};
