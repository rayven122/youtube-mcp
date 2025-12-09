import { startStreamableHttpServer } from "./transports/http.js";
import { startStdioServer } from "./transports/stdio.js";

export const startServer = async () => {
  const transportMode = process.env.TRANSPORT_MODE ?? "http";

  if (transportMode === "http") {
    startStreamableHttpServer();
  } else if (transportMode === "stdio") {
    await startStdioServer();
  } else {
    throw new Error(
      `Invalid TRANSPORT_MODE: ${transportMode}. Must be "http" or "stdio"`,
    );
  }
};
