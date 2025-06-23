import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { executeJjCommand } from "./utils.js"; // Import from the new file

async function startJujutsuMcpServer() {
  const server = new McpServer({
    name: "jujutsu",
    version: "1.0.0", // Added missing version property
    description:
      "A Model Context Protocol server for interacting with Jujutsu version control.",
    resources: [], // Removed resources from constructor
  });

  server.registerResource(
    "info",
    "jujutsu://info",
    {
      title: "Jujutsu Info", // Added this line
      description: "General information about the Jujutsu repository.",
      mime_type: "text/plain",
    },
    async (uri: URL) => {
      const status = await executeJjCommand("status");
      const log = await executeJjCommand("log -n 5");
      return {
        contents: [
          {
            uri: uri.href,
            type: "text",
            text: `Jujutsu Repository Info:\n\nStatus:\n${status}\n\nRecent Log:\n${log}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "jj_status",
    {
      title: "Jujutsu Status",
      description: "Shows the current state of the working copy and the repo.",
      inputSchema: z.object({}).shape,
    },
    async () => {
      const result = await executeJjCommand("status");
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_log",
    {
      title: "Jujutsu Log",
      description: "Shows the commit history.",
      inputSchema: z.object({
        limit: z.number().optional(),
        branch: z.string().optional(),
      }).shape,
    },
    async (args) => {
      let command = "log";
      if (args.limit) {
        command += ` -n ${args.limit}`;
      }
      if (args.branch) {
        command += ` --branch=${args.branch}`;
      }
      const result = await executeJjCommand(command);
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_commit",
    {
      title: "Jujutsu Commit",
      description: "Creates a new commit.",
      inputSchema: z.object({
        message: z.string().default("chore: new commit").optional(),
      }).shape,
    },
    async (args) => {
      const message = args.message || "chore: new commit";
      const result = await executeJjCommand(`commit -m "${message}"`);
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_amend",
    {
      title: "Jujutsu Amend Commit",
      description: "Amends the description of the current commit.",
      inputSchema: z.object({
        message: z.string().optional(),
      }).shape,
    },
    async (args) => {
      const message = args.message;
      let command = "amend";
      if (message) {
        command += ` -m "${message}"`;
      }
      const result = await executeJjCommand(command);
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_branch",
    {
      title: "Jujutsu Branch",
      description: "Manage branches.",
      inputSchema: z.object({
        action: z.enum(["list", "create", "delete"]),
        name: z.string().optional(),
      }).shape,
    },
    async (args) => {
      let command: string;
      switch (args.action) {
        case "list":
          command = "branch list";
          break;
        case "create":
          if (!args.name)
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Branch name is required for creating a branch.",
                },
              ],
            };
          command = `branch create ${args.name}`;
          break;
        case "delete":
          if (!args.name)
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Branch name is required for deleting a branch.",
                },
              ],
            };
          command = `branch delete ${args.name}`;
          break;
        default:
          return {
            content: [{ type: "text", text: "Error: Invalid branch action." }],
          };
      }
      const result = await executeJjCommand(command);
      return { content: [{ type: "text", text: result }] };
    },
  );

  const transport = new StdioServerTransport();
  server.connect(transport);

  console.error("Jujutsu MCP Server started.");
}

// IMPORTANT!
// Only start the server if this script is run directly (not imported as a module)
startJujutsuMcpServer();
