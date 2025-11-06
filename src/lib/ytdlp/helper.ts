import { spawn } from "child_process";
import * as fs from "fs";
import type { TranscriptSegment } from "@/api/types.js";
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { VttParsedResult } from "./types.js";
import { TranscriptError } from "./errors/index.js";

/**
 * Check if yt-dlp is installed
 */
export const checkYtdlpInstalled = async (): Promise<Result<void, TranscriptError>> => {
  const isInstalled = await new Promise<boolean>((resolve) => {
    const child = spawn("yt-dlp", ["--version"]);
    child.on("close", (code) => {
      resolve(code === 0);
    });
    child.on("error", () => {
      resolve(false);
    });
  });

  if (!isInstalled) {
    return err(
      TranscriptError.notInstalled(
        "yt-dlp is not installed. Please install it first: https://github.com/yt-dlp/yt-dlp/wiki/Installation",
      ),
    );
  }

  return ok(undefined);
};

/**
 * Validate YouTube Video ID format
 * YouTube Video ID format: exactly 11 characters
 * Allowed characters: a-z, A-Z, 0-9, hyphen (-), and underscore (_)
 */
export const validateVideoId = (videoId: string): Result<void, TranscriptError> => {
  if (!videoId || typeof videoId !== "string") {
    return err(TranscriptError.unknown("Video ID must be a non-empty string"));
  }

  const videoIdPattern = /^[0-9A-Za-z_-]{11}$/;
  if (!videoIdPattern.test(videoId)) {
    return err(TranscriptError.unknown("Invalid video ID format"));
  }

  return ok(undefined);
};

/**
 * Validate language code format
 * Accepts: ISO 639-1 (en, ja), ISO 639-2 (fil), BCP-47 (zh-Hans, pt-BR, es-419)
 */
export const validateLanguageCode = (
  language: string,
): Result<string, TranscriptError> => {
  if (!language || typeof language !== "string") {
    return err(TranscriptError.unknown("Language code must be a non-empty string"));
  }

  const trimmed = language.trim();
  if (!trimmed) {
    return err(TranscriptError.unknown("Language code cannot be empty"));
  }

  // Validate format: Only allow YouTube API language code formats
  const languagePattern = /^[a-z]{2,3}(-[A-Z][a-z]{3}|-[A-Z]{2}|-\d{3})?$/;

  if (!languagePattern.test(trimmed)) {
    return err(
      TranscriptError.unknown(
        `Invalid language code format: "${language}". Expected formats: ISO 639-1 (e.g., "en", "ja") or BCP-47 (e.g., "zh-Hans", "pt-BR", "es-419")`,
      ),
    );
  }

  return ok(trimmed);
};

/**
 * Parse yt-dlp error messages
 */
export const parseYtdlpError = (
  stderr: string,
  videoId: string,
  language: string,
  exitCode: number | null,
): TranscriptError => {
  if (stderr.includes("Video unavailable") || stderr.includes("ERROR: [youtube]")) {
    return TranscriptError.videoUnavailable(videoId);
  }

  if (stderr.includes("HTTP Error 429")) {
    return TranscriptError.rateLimited();
  }

  if (stderr.includes("There are no subtitles") || stderr.includes("no subtitles")) {
    return TranscriptError.noSubtitles(videoId, language);
  }

  return TranscriptError.unknown(stderr || `yt-dlp exited with code ${exitCode}`);
};

/**
 * Download subtitle using yt-dlp
 */
export const downloadSubtitleWithYtdlp = async (
  videoId: string,
  languageCode: string,
  outputPath: string,
): Promise<Result<string, TranscriptError>> => {
  // Validate video ID
  const videoIdResult = validateVideoId(videoId);
  if (videoIdResult.isErr()) {
    return err(videoIdResult.error);
  }

  // Validate language code
  const languageResult = validateLanguageCode(languageCode);
  if (languageResult.isErr()) {
    return err(languageResult.error);
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const args = [
    "--write-subs", // Try manual subtitles first
    "--write-auto-subs", // Fall back to auto-generated subtitles
    "--skip-download", // Don't download the video
    "--sub-format",
    "vtt", // Force VTT format
    "--sub-langs",
    languageResult.value,
    "--output",
    outputPath, // Output path without extension
    videoUrl,
  ];

  return new Promise((resolve) => {
    const child = spawn("yt-dlp", args, {
      env: { ...process.env, PYTHONWARNINGS: "ignore" },
    });
    let stderr = "";

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        // Check if subtitle file was created
        const expectedPath = `${outputPath}.${languageResult.value}.vtt`;
        if (!fs.existsSync(expectedPath)) {
          resolve(err(TranscriptError.noSubtitles(videoId, languageResult.value)));
        } else {
          resolve(ok(expectedPath));
        }
      } else {
        // Parse yt-dlp error messages
        const error = parseYtdlpError(stderr, videoId, languageResult.value, code);
        resolve(err(error));
      }
    });

    child.on("error", () => {
      resolve(err(TranscriptError.unknown("Failed to execute yt-dlp")));
    });
  });
};

/**
 * Map parsed VTT entries to transcript segments
 */
export const mapParsedEntriesToSegments = (
  parsed: VttParsedResult,
  startTime?: number,
  endTime?: number,
): TranscriptSegment[] => {
  return parsed.entries
    .filter((entry) => {
      const entryStart = entry.from / 1000; // Convert ms to seconds
      const entryEnd = entry.to / 1000;

      // Filter by time range if specified
      if (startTime !== undefined && entryEnd < startTime) return false;
      if (endTime !== undefined && entryStart > endTime) return false;

      return true;
    })
    .map((entry) => {
      const start = entry.from / 1000; // Convert ms to seconds
      const end = entry.to / 1000;
      return {
        start,
        end,
        duration: end - start,
        text: entry.text.trim(),
      };
    });
};
