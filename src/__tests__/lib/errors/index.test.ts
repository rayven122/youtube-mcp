import { NetworkError, ValidationError } from "@/lib/errors/index.js";
import { describe, expect, test } from "vitest";

describe("lib/errors/index.ts", () => {
  describe("ValidationError", () => {
    test("基本的なエラーインスタンスを作成できる", () => {
      const error = new ValidationError("Invalid input");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Invalid input");
      expect(error.field).toBeUndefined();
    });

    test("fieldを持つエラーインスタンスを作成できる", () => {
      const error = new ValidationError("Required field", "username");

      expect(error.message).toBe("Required field");
      expect(error.field).toBe("username");
    });
  });

  describe("NetworkError", () => {
    test("基本的なエラーインスタンスを作成できる", () => {
      const error = new NetworkError("Connection failed");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe("NetworkError");
      expect(error.message).toBe("Connection failed");
      expect(error.cause).toBeUndefined();
    });

    test("causeを持つエラーインスタンスを作成できる", () => {
      const originalError = new Error("Original error");
      const error = new NetworkError("Network failed", originalError);

      expect(error.message).toBe("Network failed");
      expect(error.cause).toBe(originalError);
    });

    test("cause に任意の値を設定できる", () => {
      const error = new NetworkError("Network failed", {
        code: "ECONNREFUSED",
      });

      expect(error.message).toBe("Network failed");
      expect(error.cause).toEqual({ code: "ECONNREFUSED" });
    });
  });
});
