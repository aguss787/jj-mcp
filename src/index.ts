import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
      const status = await executeJjCommand("status", ".");
      const log = await executeJjCommand("log -n 5", ".");
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
      inputSchema: z.object({
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
      }).shape,
    },
    async (args) => {
      const result = await executeJjCommand("status", args.workingDirectory);
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
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
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
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_commit",
    {
      title: "Jujutsu Commit",
      description: "Creates a new commit.",
      inputSchema: z.object({
        message: z.string(),
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
      }).shape,
    },
    async (args) => {
      let command = "commit";
      if (args.message !== undefined && args.message !== null) {
        const escapedMessage = args.message.replace(/'/g, "'\''");
        command += ` -m '${escapedMessage}'`;
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_desc",
    {
      title: "Jujutsu Describe Commit",
      description: "Amends the description of the specified commit.",
      inputSchema: z.object({
        message: z.string().default(""),
        revision_id: z.string().optional(),
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
      }).shape,
    },
    async (args) => {
      const message = args.message;
      const revision_id = args.revision_id;
      let command = "describe";
      const escapedMessage = message.replace(/'/g, "'\''");
      command += ` -m '${escapedMessage}'`;
      if (revision_id) {
        command += ` -r "${revision_id}"`;
      }
      const result = await executeJjCommand(command, args.workingDirectory);
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
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
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
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_diff",
    {
      title: "Jujutsu Diff",
      description: "Shows the diff of the specified revision.",
      inputSchema: z.object({
        revision_id: z.string().default("@"),
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
      }).shape,
    },
    async (args) => {
      const revision_id = args.revision_id;
      const result = await executeJjCommand(
        `diff -r "${revision_id}"`,
        args.workingDirectory,
      );
      return { content: [{ type: "text", text: result }] };
    },
  );

  server.registerTool(
    "jj_init",
    {
      title: "Jujutsu Init",
      description: "Initializes a new Jujutsu repository.",
      inputSchema: z.object({
        workingDirectory: z
          .string()
          .describe("Absolute path to the working directory."),
      }).shape,
    },
    async (args) => {
      const result = await executeJjCommand(
        "git init --colocate",
        args.workingDirectory,
      );
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
