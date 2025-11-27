import { youtubeApi } from "@/api/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

import { createMCPServer } from "./server.js";

export const startServer = async () => {
  // 環境変数から YouTube API キーを取得して検証
  const apiKeyResult = youtubeApi.getApiKeyFromEnv(process.env);
  if (apiKeyResult.isErr()) {
    throw new McpError(ErrorCode.InvalidParams, apiKeyResult.error.message);
  }
  const apiKey = apiKeyResult.value;

  // MCP サーバーの作成
  const server = createMCPServer(apiKey);

  // トランスポートの初期化と接続
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // デバッグログ
  console.error("YouTube MCP Server started successfully");
};
