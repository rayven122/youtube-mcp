import type { YoutubeApiKey } from "@/api/apiKey.js";
import { youtubeApi } from "@/api/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { z } from "zod";

import { handleToolRequest } from "../handlers.js";
import { channelTools } from "../tools/channels.js";
import { commentTools } from "../tools/comments.js";
import { playlistTools } from "../tools/playlists.js";
import { transcriptTools } from "../tools/transcripts.js";
import { videoTools } from "../tools/videos.js";

// YouTube API Key validation schema with brand
const YoutubeApiKeySchema = z
  .string({ required_error: "API key is required" })
  .trim()
  .min(1, "API key is required")
  .brand<"YoutubeApiKey">();

/**
 * リクエストからAPIキーを抽出する
 */
const extractApiKey = (req: express.Request): YoutubeApiKey => {
  // HTTPヘッダーから YouTube API キーを取得
  const headerApiKey = req.headers["x-youtube-api-key"] as string | undefined;

  if (!headerApiKey) {
    // ヘッダーにない場合は環境変数から取得を試みる
    const apiKeyResult = youtubeApi.getApiKeyFromEnv(process.env);
    if (apiKeyResult.isErr()) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "YouTube API key is required. Set via X-YouTube-API-Key header or YOUTUBE_API_KEY environment variable",
      );
    }
    return apiKeyResult.value;
  }

  // ヘッダーから取得したAPIキーを検証
  const validationResult = YoutubeApiKeySchema.safeParse(headerApiKey);
  if (!validationResult.success) {
    throw new McpError(
      ErrorCode.InvalidParams,
      validationResult.error.errors[0]?.message ?? "Invalid API key",
    );
  }

  return validationResult.data;
};

/**
 * MCPサーバーインスタンスを作成する
 */
const createMCPServer = (apiKey: YoutubeApiKey): McpServer => {
  const mcpServer = new McpServer(
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

  // 低レベルAPIを使用してツールを登録（現在のJSON Schemaを維持）
  mcpServer.server.setRequestHandler(ListToolsRequestSchema, () => {
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
  mcpServer.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

  return mcpServer;
};

export const startStreamableHttpServer = () => {
  // HTTPポートの取得（デフォルト: 8080）
  const port = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 8080;

  // Expressアプリケーションの初期化
  const app = express();

  // MCPエンドポイント
  // Statelessモード: リクエストごとに新しいサーバーとトランスポートを作成
  // これにより「Transport already started」エラーを回避
  app.post("/mcp", async (req, res) => {
    let mcpServer: McpServer | null = null;

    try {
      // APIキーを抽出
      const apiKey = extractApiKey(req);

      // リクエストごとに新しいトランスポートを作成（statelessモード）
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      // リクエストごとに新しいMCPサーバーを作成
      mcpServer = createMCPServer(apiKey);

      // サーバーとトランスポートを接続
      await mcpServer.connect(transport);

      // リクエストを処理
      await transport.handleRequest(req, res);
    } catch (error) {
      if (!res.headersSent) {
        if (error instanceof McpError) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: error.code, message: error.message },
            id: null,
          });
        } else {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "Internal server error",
            },
            id: null,
          });
        }
      }
    } finally {
      // リクエスト処理後にサーバーをクリーンアップ
      if (mcpServer) {
        await mcpServer.close().catch(() => {
          // クローズエラーは無視（すでにクローズされている可能性）
        });
      }
    }
  });

  // GETリクエストも処理（SSE接続用）
  app.get("/mcp", async (req, res) => {
    let mcpServer: McpServer | null = null;

    try {
      // 環境変数からAPIキーを取得を試みる
      const apiKeyResult = youtubeApi.getApiKeyFromEnv(process.env);
      if (apiKeyResult.isErr()) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "YouTube API key is required for SSE connections. Set YOUTUBE_API_KEY environment variable",
        );
      }

      // リクエストごとに新しいトランスポートを作成
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      // リクエストごとに新しいMCPサーバーを作成
      mcpServer = createMCPServer(apiKeyResult.value);

      // サーバーとトランスポートを接続
      await mcpServer.connect(transport);

      // リクエストを処理
      await transport.handleRequest(req, res);
    } catch (error) {
      if (!res.headersSent) {
        if (error instanceof McpError) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: error.code, message: error.message },
            id: null,
          });
        } else {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "Internal server error",
            },
            id: null,
          });
        }
      }
    } finally {
      // リクエスト処理後にサーバーをクリーンアップ
      if (mcpServer) {
        await mcpServer.close().catch(() => {
          // クローズエラーは無視
        });
      }
    }
  });

  // ヘルスチェックエンドポイント
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "youtube-mcp-server", version: "1.0.0" });
  });

  // サーバーを起動
  app.listen(port, () => {
    console.error(`YouTube MCP Server (Streamable HTTP) started on port ${port}`);
    console.error(`Endpoint: http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
};
