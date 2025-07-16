import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOLS } from "./tools";
import { RESOURCES } from "./resources";

export async function startJujutsuMcpServer() {
  const server = new McpServer({
    name: "jujutsu",
    version: "1.0.0", // Added missing version property
    description:
      "A Model Context Protocol server for interacting with Jujutsu version control.",
    resources: [], // Removed resources from constructor
  });

  // Register all resources using the RESOURCES constant
  for (const resource of RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      resource.definition,
      resource.handler,
    );
  }

  // Register all tools using the TOOLS constant
  for (const tool of TOOLS) {
    server.registerTool(tool.name, tool.definition, tool.handler);
  }

  return server;
}
