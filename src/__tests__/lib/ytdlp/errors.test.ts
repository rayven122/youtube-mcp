import type { TranscriptErrorType } from "@/lib/ytdlp/errors/index.js";
import { TranscriptError } from "@/lib/ytdlp/errors/index.js";
import { describe, expect, test } from "vitest";

describe("lib/ytdlp/errors/index.ts", () => {
  describe("TranscriptError", () => {
    // Helper function to verify error properties
    const assertTranscriptError = (
      error: TranscriptError,
      expectedType: TranscriptErrorType,
      expectedMessage: string,
      expectedOriginalError?: Error,
    ) => {
      expect(error).toBeInstanceOf(TranscriptError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("TranscriptError");
      expect(error.type).toBe(expectedType);
      expect(error.message).toBe(expectedMessage);
      expect(error.originalError).toBe(expectedOriginalError);
    };

    describe("ファクトリーメソッド", () => {
      describe("notInstalled()", () => {
        test("notInstalled() でyt-dlp未インストールエラーを作成", () => {
          const error = TranscriptError.notInstalled();
          assertTranscriptError(error, "NOT_INSTALLED", "yt-dlp is not installed");
        });
      });

      describe("noSubtitles()", () => {
        test("noSubtitles() で字幕なしエラーを作成（言語指定なし）", () => {
          const error = TranscriptError.noSubtitles("test-video");
          assertTranscriptError(
            error,
            "NO_SUBTITLES",
            "No subtitles available for video test-video",
          );
        });

        test("noSubtitles() で字幕なしエラーを作成（言語指定あり）", () => {
          const error = TranscriptError.noSubtitles("test-video", "ja");
          assertTranscriptError(
            error,
            "NO_SUBTITLES",
            "No subtitles available for video test-video in language ja",
          );
        });
      });

      describe("videoUnavailable()", () => {
        test("videoUnavailable() で動画利用不可エラーを作成", () => {
          const error = TranscriptError.videoUnavailable("private-video");
          assertTranscriptError(
            error,
            "VIDEO_UNAVAILABLE",
            "Video private-video is unavailable or private",
          );
        });
      });

      describe("networkError()", () => {
        test("networkError() でメッセージなしのネットワークエラーを作成", () => {
          const error = TranscriptError.networkError();
          assertTranscriptError(error, "NETWORK_ERROR", "Network error occurred");
        });

        test("networkError() でメッセージありのネットワークエラーを作成", () => {
          const error = TranscriptError.networkError("Connection timeout");
          assertTranscriptError(error, "NETWORK_ERROR", "Connection timeout");
        });

        test("networkError() で元エラー付きのネットワークエラーを作成", () => {
          const originalError = new Error("ECONNREFUSED");
          const error = TranscriptError.networkError("Connection failed", originalError);
          assertTranscriptError(
            error,
            "NETWORK_ERROR",
            "Connection failed",
            originalError,
          );
        });
      });

      describe("parseError()", () => {
        test("parseError() でメッセージなしのパースエラーを作成", () => {
          const error = TranscriptError.parseError();
          assertTranscriptError(error, "PARSE_ERROR", "Failed to parse subtitle content");
        });

        test("parseError() でメッセージありのパースエラーを作成", () => {
          const error = TranscriptError.parseError("Invalid VTT format");
          assertTranscriptError(error, "PARSE_ERROR", "Invalid VTT format");
        });

        test("parseError() で元エラー付きのパースエラーを作成", () => {
          const originalError = new SyntaxError("Unexpected token");
          const error = TranscriptError.parseError("VTT parsing failed", originalError);
          assertTranscriptError(
            error,
            "PARSE_ERROR",
            "VTT parsing failed",
            originalError,
          );
        });
      });

      describe("unknown()", () => {
        test("unknown() でメッセージなしの未知のエラーを作成", () => {
          const error = TranscriptError.unknown();
          assertTranscriptError(error, "UNKNOWN", "Unknown error occurred");
        });

        test("unknown() でメッセージありの未知のエラーを作成", () => {
          const error = TranscriptError.unknown("Unexpected error");
          assertTranscriptError(error, "UNKNOWN", "Unexpected error");
        });

        test("unknown() で元エラー付きの未知のエラーを作成", () => {
          const originalError = new Error("Something went wrong");
          const error = TranscriptError.unknown("Process failed", originalError);
          assertTranscriptError(error, "UNKNOWN", "Process failed", originalError);
        });
      });

      describe("rateLimited()", () => {
        test("rateLimited() でレート制限エラーを作成", () => {
          const error = TranscriptError.rateLimited();
          assertTranscriptError(error, "RATE_LIMITED", "YouTube rate limit exceeded");
        });

        test("rateLimited() でカスタムメッセージのレート制限エラーを作成", () => {
          const error = TranscriptError.rateLimited("Too many requests");
          assertTranscriptError(error, "RATE_LIMITED", "Too many requests");
        });
      });
    });
  });
});
