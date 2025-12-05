import type { YoutubeApiKey } from "@/api/apiKey.js";
import { validateApiKey } from "@/api/apiKey.js";
import { describe, expect, test } from "vitest";

describe("validateApiKey", () => {
  describe("正常系", () => {
    test("有効なAPIキー文字列の場合にOKを返す", () => {
      const result = validateApiKey("test-api-key");

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual("test-api-key" as YoutubeApiKey);
    });

    test("両端に空白があるAPIキー文字列の場合にトリムしてOKを返す", () => {
      const result = validateApiKey("  test-api-key  ");

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result._unsafeUnwrap()).toStrictEqual("test-api-key" as YoutubeApiKey);
    });
  });

  describe("異常系", () => {
    test.each([
      ["空文字列", ""],
      ["空白文字のみ", "   "],
      ["タブのみ", "\t\t"],
      ["改行のみ", "\n\n"],
      ["混合空白文字", " \t\n "],
    ])("APIキーが%sの場合にエラーを返す", (_, value) => {
      const result = validateApiKey(value);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toStrictEqual(new Error("API key is required"));
    });
  });
});
