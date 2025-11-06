/**
 * yt-dlp transcript retrieval error types
 */
export type TranscriptErrorType =
  | "NOT_INSTALLED"
  | "RATE_LIMITED"
  | "NO_SUBTITLES"
  | "VIDEO_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN";

/**
 * Error class for yt-dlp transcript operations
 */
export class TranscriptError extends Error {
  constructor(
    public readonly type: TranscriptErrorType,
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "TranscriptError";
  }

  static notInstalled(message?: string): TranscriptError {
    return new TranscriptError("NOT_INSTALLED", message ?? "yt-dlp is not installed");
  }

  static rateLimited(message?: string): TranscriptError {
    return new TranscriptError("RATE_LIMITED", message ?? "YouTube rate limit exceeded");
  }

  static noSubtitles(videoId: string, language?: string): TranscriptError {
    const msg = language
      ? `No subtitles available for video ${videoId} in language ${language}`
      : `No subtitles available for video ${videoId}`;
    return new TranscriptError("NO_SUBTITLES", msg);
  }

  static videoUnavailable(videoId: string): TranscriptError {
    return new TranscriptError(
      "VIDEO_UNAVAILABLE",
      `Video ${videoId} is unavailable or private`,
    );
  }

  static networkError(message?: string, originalError?: Error): TranscriptError {
    return new TranscriptError(
      "NETWORK_ERROR",
      message ?? "Network error occurred",
      originalError,
    );
  }

  static parseError(message?: string, originalError?: Error): TranscriptError {
    return new TranscriptError(
      "PARSE_ERROR",
      message ?? "Failed to parse subtitle content",
      originalError,
    );
  }

  static unknown(message?: string, originalError?: Error): TranscriptError {
    return new TranscriptError(
      "UNKNOWN",
      message ?? "Unknown error occurred",
      originalError,
    );
  }
}
