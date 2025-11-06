import type { YoutubeApiKey } from "@/api/apiKey.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "neverthrow";
import { getTranscriptMetadata } from "@/api/transcripts/index.js";
import { getTranscript as getTranscriptYtdlp } from "@/lib/ytdlp/index.js";
import { YOU_TUBE_TOOL_NAMES } from "@/mcp/constants.js";
import { GetTranscriptMetadataSchema, GetTranscriptSchema } from "@/mcp/types.js";
import { err, ok } from "neverthrow";

/**
 * 字幕ツールの定義
 */
export const transcriptTools = [
  {
    name: YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT_METADATA,
    description: "動画で利用可能な字幕のメタデータを取得します",
    inputSchema: {
      type: "object",
      properties: {
        videoId: {
          type: "string",
          description: "YouTube動画のID",
        },
      },
      required: ["videoId"],
    },
  },
  {
    name: YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT,
    description: "動画の字幕を取得します（yt-dlpのインストールが必要）",
    inputSchema: {
      type: "object",
      properties: {
        videoId: {
          type: "string",
          description: "YouTube動画のID",
        },
        language: {
          type: "string",
          description: "言語コード（例: ja, en）",
        },
        startTime: {
          type: "number",
          description: "開始時間（秒）",
        },
        endTime: {
          type: "number",
          description: "終了時間（秒）",
        },
      },
      required: ["videoId", "language"],
    },
  },
];

/**
 * 字幕ツールのハンドラー
 */
export const handleTranscriptTool = async (
  toolName: string,
  args: unknown,
  apiKey: YoutubeApiKey,
): Promise<Result<CallToolResult, Error>> => {
  try {
    switch (toolName) {
      case YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT_METADATA: {
        const input = GetTranscriptMetadataSchema.parse(args);
        const result = await getTranscriptMetadata(input.videoId, apiKey);
        if (result.isErr()) {
          return err(result.error);
        }
        return ok({
          content: [{ type: "text", text: JSON.stringify(result.value) }],
        });
      }

      case YOU_TUBE_TOOL_NAMES.GET_TRANSCRIPT: {
        const input = GetTranscriptSchema.parse(args);
        const transcriptResult = await getTranscriptYtdlp(
          input.videoId,
          input.language,
          input.startTime,
          input.endTime,
        );

        if (transcriptResult.isErr()) {
          return err(transcriptResult.error);
        }

        return ok({
          content: [{ type: "text", text: JSON.stringify(transcriptResult.value) }],
        });
      }

      default:
        return err(new Error(`Unknown tool: ${toolName}`));
    }
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
};
