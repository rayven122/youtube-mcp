import { YouTubeApiError } from "@/api/errors/index.js";
import { describe, expect, test } from "vitest";

describe("api/errors/index.ts", () => {
  describe("YouTubeApiError", () => {
    test("エラーメッセージのみでインスタンスを作成", () => {
      const error = new YouTubeApiError("API Error");

      expect(error.message).toBe("API Error");
      expect(error).toBeInstanceOf(YouTubeApiError);
      expect(error.name).toBe("YouTubeApiError");
      expect(error.statusCode).toBeUndefined();
      expect(error.response).toBeUndefined();
    });

    test("ステータスコードとレスポンス付きでインスタンスを作成", () => {
      const error = new YouTubeApiError("Not Found", 404, "Resource not found");

      expect(error.message).toBe("Not Found");
      expect(error.statusCode).toBe(404);
      expect(error.response).toBe("Resource not found");
    });

    test("ステータスコードのみ付きでインスタンスを作成", () => {
      const error = new YouTubeApiError("Bad Request", 400);

      expect(error.message).toBe("Bad Request");
      expect(error.statusCode).toBe(400);
      expect(error.response).toBeUndefined();
    });
  });
});
