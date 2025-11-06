import type { YoutubeApiKey } from "@/api/apiKey.js";
import { YouTubeApiError } from "@/api/errors/index.js";
import { fetchApi } from "@/api/fetcher.js";
import { NetworkError } from "@/lib/errors/index.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

// globalThis.fetchをモック化
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("fetchApi", () => {
  const mockApiKey = "test-api-key" as YoutubeApiKey;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test("正常系: 成功レスポンスの場合にデータを返す", async () => {
    const mockResponse = { data: "test" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result._unsafeUnwrap()).toStrictEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/youtube/v3/test?key=test-api-key",
    );
  });

  test("正常系: クエリパラメータが正しく追加される", async () => {
    const mockResponse = { data: "test" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchApi("test", { q: "query", maxResults: 10 }, mockApiKey);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/youtube/v3/test?key=test-api-key&q=query&maxResults=10",
    );
  });

  test("正常系: undefinedのパラメータは除外される", async () => {
    const mockResponse = { data: "test" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchApi("test", { q: "query", maxResults: undefined }, mockApiKey);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/youtube/v3/test?key=test-api-key&q=query",
    );
  });

  test("異常系: HTTPエラーの場合にFailureを返す", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: () => Promise.resolve("Not Found"),
    });

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      new YouTubeApiError("YouTube API Error: Not Found", 404, "Not Found"),
    );
  });

  test("異常系: ネットワークエラーの場合にFailureを返す", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      new NetworkError(
        "Network error occurred: Network error",
        new Error("Network error"),
      ),
    );
  });

  test("異常系: JSONパースエラーの場合にFailureを返す", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      new NetworkError("Network error occurred: Invalid JSON", new Error("Invalid JSON")),
    );
  });

  test("異常系: Error以外の値でリジェクトされた場合にデフォルトメッセージを使用", async () => {
    mockFetch.mockRejectedValueOnce("String error");

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      new NetworkError("Network error occurred: Unknown error", "String error"),
    );
  });

  test("異常系: response.text()が失敗した場合にstatusTextまたはデフォルトメッセージを使用", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.reject(new Error("Text read failed")),
    });

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      new YouTubeApiError(
        "YouTube API Error: Internal Server Error",
        500,
        "Internal Server Error",
      ),
    );
  });

  test("異常系: response.text()が失敗しstatusTextも空の場合にデフォルトメッセージを使用", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "",
      text: () => Promise.reject(new Error("Text read failed")),
    });

    const result = await fetchApi("test", {}, mockApiKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      new YouTubeApiError("YouTube API Error: Unknown error", 500, "Unknown error"),
    );
  });
});
