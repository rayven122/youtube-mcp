#!/usr/bin/env node
import { startHttpServer } from "@/mcp/httpServer.js";
import { startServer } from "@/mcp/index.js";

// エントリポイント
const transportMode = process.env.TRANSPORT_MODE ?? "stdio";

if (transportMode === "http") {
  // HTTP モード
  startHttpServer();
} else {
  // STDIO モード (デフォルト)
  startServer().catch((error) => {
    console.error("Failed to start YouTube MCP Server:", error);
    process.exit(1);
  });
}
