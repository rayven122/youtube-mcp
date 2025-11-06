import { TranscriptError } from "@/lib/ytdlp/errors/index.js";
import { validateLanguageCode, validateVideoId } from "@/lib/ytdlp/helper.js";
import { describe, expect, test } from "vitest";

describe("ytdlp validation", () => {
  describe("validateVideoId", () => {
    describe("有効なVideo ID", () => {
      test.each([
        "dQw4w9WgXcQ", // 標準的なYouTube ID
        "1234567890a", // 数字と小文字
        "ABCDEFGHIJK", // すべて大文字
        "_-_-_-_-_-_", // アンダースコアとハイフン
        "a_b-c_d-e_f", // 混在
      ])("正常系: %s は有効なIDとして受け入れられる", (videoId) => {
        const result = validateVideoId(videoId);
        expect(result.isOk()).toBe(true);
        expect(result.isErr()).toBe(false);
        expect(result._unsafeUnwrap()).toBeUndefined();
      });
    });

    describe("無効なVideo ID", () => {
      test("異常系: 空文字列は拒否される", () => {
        const result = validateVideoId("");
        expect(result.isOk()).toBe(false);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Video ID must be a non-empty string"),
        );
      });

      test.each([
        ["123456789", "9文字（短すぎる）"],
        ["123456789012", "12文字（長すぎる）"],
        ["12345678!01", "特殊文字を含む"],
        ["12345 67890", "スペースを含む"],
        ["https://youtu.be/dQw4w9WgXcQ", "URL形式"],
        ["watch?v=dQw4w9WgXcQ", "クエリパラメータ形式"],
      ])("異常系: %s (%s) は拒否される", (videoId, _description) => {
        const result = validateVideoId(videoId);
        expect(result.isOk()).toBe(false);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Invalid video ID format"),
        );
      });

      test("異常系: nullを拒否する", () => {
        const result = validateVideoId(null as any);
        expect(result.isOk()).toBe(false);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Video ID must be a non-empty string"),
        );
      });

      test("異常系: undefinedを拒否する", () => {
        const result = validateVideoId(undefined as any);
        expect(result.isOk()).toBe(false);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Video ID must be a non-empty string"),
        );
      });

      test("異常系: 数値を拒否する", () => {
        const result = validateVideoId(12345678901 as any);
        expect(result.isOk()).toBe(false);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Video ID must be a non-empty string"),
        );
      });
    });
  });

  describe("validateLanguageCode", () => {
    describe("有効な言語コード", () => {
      test.each([
        "en", // ISO 639-1
        "ja", // ISO 639-1
        "es", // ISO 639-1
        "fil", // ISO 639-2 (Filipino)
        "zh-Hans", // BCP-47 (簡体字中国語)
        "zh-Hant", // BCP-47 (繁体字中国語)
        "pt-BR", // 国コード付き
        "en-US", // 国コード付き
        "es-419", // 地域コード付き（ラテンアメリカ）
      ])("正常系: %s は有効な言語コードとして受け入れられる", (code) => {
        const result = validateLanguageCode(code);
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toStrictEqual(code);
      });
    });

    describe("無効な言語コード", () => {
      test("異常系: 空文字列は拒否される", () => {
        const result = validateLanguageCode("");
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Language code must be a non-empty string"),
        );
      });

      test("異常系: 空白のみは拒否される", () => {
        const result = validateLanguageCode("   ");
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Language code cannot be empty"),
        );
      });

      test.each([
        ["e", "1文字"],
        ["english", "長すぎる"],
        ["EN", "大文字のみ（ISO 639-1は小文字）"],
        ["en-us", "国コードが小文字"],
        ["en_US", "アンダースコア区切り"],
        ["en.US", "ドット区切り"],
        ["123", "数字のみ"],
        ["en-", "不完全な形式"],
        ["-US", "言語コードなし"],
        ["日本語", "非ASCII文字"],
      ])("異常系: %s (%s) は拒否される", (code, _description) => {
        const result = validateLanguageCode(code);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown(
            `Invalid language code format: "${code}". Expected formats: ISO 639-1 (e.g., "en", "ja") or BCP-47 (e.g., "zh-Hans", "pt-BR", "es-419")`,
          ),
        );
      });

      test("異常系: nullを拒否する", () => {
        const result = validateLanguageCode(null as any);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Language code must be a non-empty string"),
        );
      });

      test("異常系: undefinedを拒否する", () => {
        const result = validateLanguageCode(undefined as any);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Language code must be a non-empty string"),
        );
      });

      test("異常系: 数値を拒否する", () => {
        const result = validateLanguageCode(123 as any);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Language code must be a non-empty string"),
        );
      });

      test("異常系: オブジェクトを拒否する", () => {
        const result = validateLanguageCode({ code: "en" } as any);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toStrictEqual(
          TranscriptError.unknown("Language code must be a non-empty string"),
        );
      });
    });

    describe("正規化とトリム", () => {
      test("前後の空白をトリムする", () => {
        const result = validateLanguageCode("  en  ");
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toStrictEqual("en");
      });

      test("タブと改行もトリムする", () => {
        const result = validateLanguageCode("\t\nen-US\n\t");
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toStrictEqual("en-US");
      });
    });
  });
});
