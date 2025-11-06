import * as fs from "fs";
import { TranscriptError } from "@/lib/ytdlp/errors/index.js";
import { checkYtdlpInstalled, downloadSubtitleWithYtdlp } from "@/lib/ytdlp/helper.js";
import { getTranscript } from "@/lib/ytdlp/index.js";
import { parse as parseVtt } from "@plussub/srt-vtt-parser";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, test, vi } from "vitest";

// モジュールをモック化
vi.mock("fs", () => ({
  mkdtempSync: vi.fn(),
  readFileSync: vi.fn(),
  rmSync: vi.fn(),
}));

vi.mock("os", () => ({
  tmpdir: () => "/tmp",
}));

vi.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
}));

vi.mock("crypto", () => ({
  randomBytes: () => ({ toString: () => "abcd1234" }),
}));

vi.mock("@/lib/ytdlp/helper.js", async () => {
  const actual = await vi.importActual("@/lib/ytdlp/helper.js");
  return {
    ...actual,
    checkYtdlpInstalled: vi.fn(),
    downloadSubtitleWithYtdlp: vi.fn(),
    // mapParsedEntriesToSegmentsは実際の関数を使用
  };
});

vi.mock("@plussub/srt-vtt-parser", () => ({
  parse: vi.fn(),
}));

const mockMkdtempSync = vi.mocked(fs.mkdtempSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);
const mockRmSync = vi.mocked(fs.rmSync);
const mockCheckYtdlpInstalled = vi.mocked(checkYtdlpInstalled);
const mockDownloadSubtitleWithYtdlp = vi.mocked(downloadSubtitleWithYtdlp);
const mockParseVtt = vi.mocked(parseVtt);

describe("getTranscript", () => {
  const mockVttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
We're no strangers to love

00:00:03.000 --> 00:00:06.000
You know the rules and so do I`;

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック設定
    mockMkdtempSync.mockReturnValue("/tmp/yt-dlp-test");
    mockReadFileSync.mockReturnValue(mockVttContent);
    mockParseVtt.mockReturnValue({
      entries: [
        {
          id: "1",
          from: 0,
          to: 3000,
          text: "We're no strangers to love",
        },
        {
          id: "2",
          from: 3000,
          to: 6000,
          text: "You know the rules and so do I",
        },
      ],
    } as any);
  });

  test("正常系: 字幕を正常に取得できる", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.en.vtt"),
    );

    const result = await getTranscript("test-video-id", "en");

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result._unsafeUnwrap()).toStrictEqual({
      segments: [
        {
          start: 0,
          end: 3,
          duration: 3,
          text: "We're no strangers to love",
        },
        {
          start: 3,
          end: 6,
          duration: 3,
          text: "You know the rules and so do I",
        },
      ],
    });

    expect(mockCheckYtdlpInstalled).toHaveBeenCalledOnce();
    expect(mockDownloadSubtitleWithYtdlp).toHaveBeenCalledWith(
      "test-video-id",
      "en",
      "/tmp/yt-dlp-test/subtitle_abcd1234",
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(
      "/tmp/yt-dlp-test/subtitle_abcd1234.en.vtt",
      "utf-8",
    );
    expect(mockRmSync).toHaveBeenCalledWith("/tmp/yt-dlp-test", {
      recursive: true,
      force: true,
    });
  });

  test("正常系: 開始時間と終了時間を指定して字幕を取得する", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.en.vtt"),
    );

    const result = await getTranscript("test-video-id", "en", 1, 4);

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result._unsafeUnwrap()).toStrictEqual({
      segments: [
        {
          start: 0,
          end: 3,
          duration: 3,
          text: "We're no strangers to love",
        },
        {
          start: 3,
          end: 6,
          duration: 3,
          text: "You know the rules and so do I",
        },
      ],
    });
  });

  test("正常系: 開始時間のみを指定して字幕を取得する", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.en.vtt"),
    );

    const result = await getTranscript("test-video-id", "en", 3);

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result._unsafeUnwrap()).toStrictEqual({
      segments: [
        {
          start: 0,
          end: 3,
          duration: 3,
          text: "We're no strangers to love",
        },
        {
          start: 3,
          end: 6,
          duration: 3,
          text: "You know the rules and so do I",
        },
      ],
    });
  });

  test("正常系: 終了時間のみを指定して字幕を取得する", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.en.vtt"),
    );

    const result = await getTranscript("test-video-id", "en", undefined, 3);

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result._unsafeUnwrap()).toStrictEqual({
      segments: [
        {
          start: 0,
          end: 3,
          duration: 3,
          text: "We're no strangers to love",
        },
        {
          start: 3,
          end: 6,
          duration: 3,
          text: "You know the rules and so do I",
        },
      ],
    });
  });

  test("異常系: yt-dlpがインストールされていない場合にエラーを返す", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(
      err(TranscriptError.notInstalled("yt-dlp is not installed")),
    );

    const result = await getTranscript("test-video-id", "en");

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      TranscriptError.notInstalled("yt-dlp is not installed"),
    );

    expect(mockCheckYtdlpInstalled).toHaveBeenCalledOnce();
    expect(mockDownloadSubtitleWithYtdlp).not.toHaveBeenCalled();
  });

  test("異常系: 字幕ダウンロードが失敗した場合にエラーを返す", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      err(TranscriptError.noSubtitles("test-video-id", "en")),
    );

    const result = await getTranscript("test-video-id", "en");

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toStrictEqual(
      TranscriptError.noSubtitles("test-video-id", "en"),
    );

    expect(mockCheckYtdlpInstalled).toHaveBeenCalledOnce();
    expect(mockDownloadSubtitleWithYtdlp).toHaveBeenCalledOnce();
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  test("正常系: 一時ディレクトリのクリーンアップが失敗してもエラーにならない", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.en.vtt"),
    );
    mockRmSync.mockImplementationOnce(() => {
      throw new Error("Permission denied");
    });

    const result = await getTranscript("test-video-id", "en");

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result._unsafeUnwrap()).toStrictEqual({
      segments: [
        {
          start: 0,
          end: 3,
          duration: 3,
          text: "We're no strangers to love",
        },
        {
          start: 3,
          end: 6,
          duration: 3,
          text: "You know the rules and so do I",
        },
      ],
    });
    expect(mockRmSync).toHaveBeenCalledWith("/tmp/yt-dlp-test", {
      recursive: true,
      force: true,
    });
  });

  test("正常系: VTTファイルが正しく読み込まれ解析される", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.ja.vtt"),
    );

    await getTranscript("test-video-id", "ja");

    expect(mockParseVtt).toHaveBeenCalledWith(mockVttContent);
    expect(mockReadFileSync).toHaveBeenCalledWith(
      "/tmp/yt-dlp-test/subtitle_abcd1234.ja.vtt",
      "utf-8",
    );
  });

  test("正常系: 一時ディレクトリとファイル名が正しく生成される", async () => {
    mockCheckYtdlpInstalled.mockResolvedValueOnce(ok(undefined));
    mockDownloadSubtitleWithYtdlp.mockResolvedValueOnce(
      ok("/tmp/yt-dlp-test/subtitle_abcd1234.zh.vtt"),
    );

    await getTranscript("test-video-id", "zh");

    expect(mockMkdtempSync).toHaveBeenCalledWith("/tmp/yt-dlp-");
    expect(mockDownloadSubtitleWithYtdlp).toHaveBeenCalledWith(
      "test-video-id",
      "zh",
      "/tmp/yt-dlp-test/subtitle_abcd1234",
    );
  });
});
