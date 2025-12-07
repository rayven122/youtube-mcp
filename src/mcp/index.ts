import { youtubeApi } from "@/api/index.js";
import type { YoutubeApiKey } from "@/api/apiKey.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import type { ServerResponse } from "node:http";
import { z } from "zod";

import { handleToolRequest } from "./handlers.js";
import { channelTools } from "./tools/channels.js";
import { commentTools } from "./tools/comments.js";
import { playlistTools } from "./tools/playlists.js";
import { transcriptTools } from "./tools/transcripts.js";
import { videoTools } from "./tools/videos.js";

// YouTube API Key validation schema
const YoutubeApiKeySchema = z
  .string({ required_error: "API key is required" })
  .trim()
  .min(1, "API key is required");

/**
 * 純粋なJSON-RPC over HTTPトランスポート（SSE不使用）
 * application/jsonのみを要求し、レスポンスも純粋なJSONで返す
 */
class JSONRPCHTTPTransport implements Transport {
  private _response: ServerResponse | null = null;
  private _messageHandler: ((message: JSONRPCMessage) => void) | null = null;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  async start(): Promise<void> {
    // ノーオペ: 接続はリクエストごとに管理される
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this._response && !this._response.headersSent) {
      this._response.setHeader("Content-Type", "application/json");
      this._response.end(JSON.stringify(message));
    }
  }

  async close(): Promise<void> {
    this._response = null;
    this._messageHandler = null;
  }

  /**
   * HTTPリクエストを処理してJSONRPCメッセージをサーバーに送信
   */
  handleRequest(res: ServerResponse, message: JSONRPCMessage): void {
    this._response = res;

    // onmessageハンドラーを呼び出してMcpServerにメッセージを渡す
    if (this.onmessage) {
      this.onmessage(message);
    }
  }
}

const startStreamableHttpServer = async () => {
  // HTTPポートの取得（デフォルト: 8080）
  const port = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 8080;

  // Expressアプリケーションの初期化
  const app = express();
  app.use(express.json());

  // ツール実行時のAPIキー取得用ヘルパー
  const extractApiKey = (req: express.Request): YoutubeApiKey => {
    // HTTPヘッダーから YouTube API キーを取得
    const headerApiKey = req.headers["x-youtube-api-key"] as string | undefined;

    if (!headerApiKey) {
      // ヘッダーにない場合は環境変数から取得を試みる
      const apiKeyResult = youtubeApi.getApiKeyFromEnv(process.env);
      if (apiKeyResult.isErr()) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "YouTube API key is required. Set via X-YouTube-API-Key header or YOUTUBE_API_KEY environment variable"
        );
      }
      return apiKeyResult.value;
    }

    // ヘッダーから取得したAPIキーを検証
    const validationResult = YoutubeApiKeySchema.safeParse(headerApiKey);
    if (!validationResult.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        validationResult.error.errors[0]?.message ?? "Invalid API key"
      );
    }

    // 検証後にブランド型にキャスト
    return validationResult.data as YoutubeApiKey;
  };

  // リクエストごとにサーバーインスタンスを作成する関数
  const createMCPServer = (apiKey: YoutubeApiKey) => {
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

  // MCP エンドポイント（完全にstateless: リクエストごとにサーバーとトランスポートを作成）
  app.post("/mcp", async (req, res) => {
    let transport: JSONRPCHTTPTransport | null = null;
    let mcpServer: McpServer | null = null;

    try {
      // Content-Typeの検証（リクエストボディがJSON形式であることを確認）
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        res.status(415).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Unsupported Media Type: Content-Type must be application/json"
          },
          id: null
        });
        return;
      }

      // APIキーを取得
      const apiKey = extractApiKey(req);

      // リクエストごとに新しいサーバーとトランスポートを作成
      mcpServer = createMCPServer(apiKey);
      transport = new JSONRPCHTTPTransport();

      // サーバーとトランスポートを接続
      await mcpServer.connect(transport);

      // JSONRPCメッセージを処理
      transport.handleRequest(res, req.body as JSONRPCMessage);

      // クリーンアップ（メモリリーク防止）
      res.on("close", () => {
        transport?.close();
        mcpServer?.close();
      });
    } catch (error) {
      // エラー時のクリーンアップ
      transport?.close();
      mcpServer?.close();

      if (!res.headersSent) {
        if (error instanceof McpError) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: error.code, message: error.message },
            id: null
          });
        } else {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "Internal server error"
            },
            id: null
          });
        }
      }
    }
  });

  // ヘルスチェックエンドポイント
  app.get("/health", (req, res) => {
    res.json({ status: "ok", server: "youtube-mcp-server", version: "1.0.0" });
  });

  // サーバーを起動
  app.listen(port, () => {
    console.error(`YouTube MCP Server (Streamable HTTP) started on port ${port}`);
    console.error(`Endpoint: http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
};

const startStdioServer = async () => {
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

export const startServer = async () => {
  const transportMode = process.env.TRANSPORT_MODE || "http";

  if (transportMode === "http") {
    await startStreamableHttpServer();
  } else if (transportMode === "stdio") {
    await startStdioServer();
  } else {
    throw new Error(
      `Invalid TRANSPORT_MODE: ${transportMode}. Must be "http" or "stdio"`
    );
  }
};