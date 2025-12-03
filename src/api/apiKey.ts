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
 * Validates a YouTube API key string and returns it as a branded type
 */
export const validateApiKey = (apiKey: string): Result<YoutubeApiKey, Error> => {
  const result = YoutubeApiKeySchema.safeParse(apiKey);

  if (!result.success) {
    return err(new Error(result.error.errors[0]?.message ?? "Invalid API key"));
  }

  // Cast to branded type after validation
  return ok(result.data as YoutubeApiKey);
};
