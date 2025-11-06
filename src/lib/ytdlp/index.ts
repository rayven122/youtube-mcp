import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { TranscriptResponse } from "@/api/types.js";
import type { Result } from "neverthrow";
import { parse as parseVtt } from "@plussub/srt-vtt-parser";
import { err, ok } from "neverthrow";

import type { VttParsedResult } from "./types.js";
import { TranscriptError } from "./errors/index.js";
import {
  checkYtdlpInstalled,
  downloadSubtitleWithYtdlp,
  mapParsedEntriesToSegments,
} from "./helper.js";

/**
 * Get transcript for a YouTube video using yt-dlp
 * @param videoId YouTube video ID (11 characters)
 * @param language Language code (e.g., "en", "ja", "zh-Hans")
 * @param startTime Optional start time in seconds
 * @param endTime Optional end time in seconds
 * @returns Result with transcript segments or error
 */
export const getTranscript = async (
  videoId: string,
  language: string,
  startTime?: number,
  endTime?: number,
): Promise<Result<TranscriptResponse, Error>> => {
  // Check yt-dlp installation
  const installResult = await checkYtdlpInstalled();
  if (installResult.isErr()) {
    return err(installResult.error);
  }

  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yt-dlp-"));
  const tempFilename = `subtitle_${crypto.randomBytes(8).toString("hex")}`;
  const outputPath = path.join(tempDir, tempFilename);

  try {
    const downloadResult = await downloadSubtitleWithYtdlp(videoId, language, outputPath);
    if (downloadResult.isErr()) {
      return err(downloadResult.error);
    }

    // Parse VTT content
    const vttContent = fs.readFileSync(downloadResult.value, "utf-8");
    const parsed = parseVtt(vttContent) as VttParsedResult;

    // Convert to our segment format
    const segments = mapParsedEntriesToSegments(parsed, startTime, endTime);

    return ok({ segments });
  } catch (error) {
    if (error instanceof Error) {
      return err(TranscriptError.parseError("Failed to parse subtitle content", error));
    }
    return err(TranscriptError.unknown(`Unexpected error: ${String(error)}`));
  } finally {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
};
