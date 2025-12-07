#!/usr/bin/env node

import "dotenv/config";

import { startServer } from "@/mcp/index.js";

// エントリポイント
startServer().catch((error) => {
  console.error("Failed to start YouTube MCP Server:", error);
  process.exit(1);
});
