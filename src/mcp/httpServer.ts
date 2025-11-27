import { youtubeApi } from "@/api/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { createMCPServer } from "./server.js";

export const startHttpServer = () => {
  // 環境変数から YouTube API キーを取得（オプション）
  const envApiKeyResult = youtubeApi.getApiKeyFromEnv(process.env);
  const hasEnvApiKey = envApiKeyResult.isOk();

  if (!hasEnvApiKey) {
    console.error(
      "Warning: YOUTUBE_API_KEY not found in environment variables. API key must be provided via X-YouTube-API-Key header.",
    );
  }

  // Express アプリケーションのセットアップ
  const app = express();
  app.use(express.json());

  // MCPエンドポイント
  app.post("/mcp", async (req, res) => {
    try {
      // ヘッダーまたは環境変数からAPIキーを取得
      const headerApiKey = req.headers["x-youtube-api-key"] as string | undefined;

      let apiKey;
      if (headerApiKey) {
        // ヘッダーからAPIキーを検証
        const headerApiKeyResult = youtubeApi.getApiKeyFromEnv({
          YOUTUBE_API_KEY: headerApiKey,
        });
        if (headerApiKeyResult.isErr()) {
          res.status(401).json({
            error: "Invalid API key provided in header",
            message: headerApiKeyResult.error.message,
          });
          return;
        }
        apiKey = headerApiKeyResult.value;
      } else if (hasEnvApiKey) {
        // 環境変数のAPIキーを使用
        apiKey = envApiKeyResult.value;
      } else {
        // APIキーが提供されていない
        res.status(401).json({
          error: "API key required",
          message:
            "Please provide YouTube API key via X-YouTube-API-Key header or YOUTUBE_API_KEY environment variable",
        });
        return;
      }

      // リクエストごとに新しいサーバーとトランスポートを作成
      const server = createMCPServer(apiKey);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      // レスポンスがクローズされたらトランスポートをクリーンアップ
      res.on("close", () => {
        void transport.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  // ヘルスチェックエンドポイント
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // サーバーの起動
  const port = parseInt(process.env.HTTP_PORT ?? "3000", 10);
  app.listen(port, () => {
    console.error(`YouTube MCP HTTP Server started on port ${port}`);
    console.error(`Endpoint: http://localhost:${port}/mcp`);
  });
};
