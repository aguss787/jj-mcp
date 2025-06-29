#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startJujutsuMcpServer } from "./jujutsuMcpServer.js"; // Import the function

// IMPORTANT!
// Only start the server if this script is run directly (not imported as a module)
async function main() {
  const server = await startJujutsuMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.error("Jujutsu MCP Server started.");
}

main();
