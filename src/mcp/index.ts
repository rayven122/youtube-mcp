import { youtubeApi } from "@/api/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

export const startServer = async () => {
  // 環境変数から YouTube API キーを取得して検証
  const apiKeyResult = youtubeApi.getApiKeyFromEnv(process.env);
  if (apiKeyResult.isErr()) {
    throw new McpError(ErrorCode.InvalidParams, apiKeyResult.error.message);
  }
  const apiKey = apiKeyResult.value;

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

  // トランスポートの初期化と接続
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // デバッグログ
  console.error("YouTube MCP Server started successfully");
};
