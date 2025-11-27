import type { YoutubeApiKey } from "@/api/apiKey.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { handleToolRequest } from "./handlers.js";
import { channelTools } from "./tools/channels.js";
import { commentTools } from "./tools/comments.js";
import { playlistTools } from "./tools/playlists.js";
import { transcriptTools } from "./tools/transcripts.js";
import { videoTools } from "./tools/videos.js";

export const createMCPServer = (apiKey: YoutubeApiKey): Server => {
  // MCP サーバーの初期化
  const server = new Server(
    {
      name: "youtube-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // ツール一覧の取得ハンドラー
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: [
        ...videoTools,
        ...channelTools,
        ...playlistTools,
        ...commentTools,
        ...transcriptTools,
      ],
    };
  });

  // ツール実行ハンドラー
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name: toolName, arguments: args } = request.params;

    // すべてのツールを共通ハンドラーで処理
    const result = await handleToolRequest(toolName, args, apiKey);

    // Result型のエラーチェック
    if (result.isErr()) {
      throw new McpError(
        ErrorCode.InternalError,
        result.error instanceof Error ? result.error.message : "Operation failed",
      );
    }

    // MCPの期待する形式でレスポンスを返す
    return result.value;
  });

  return server;
};
