import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec as cp_exec } from "child_process";
import { promisify } from "util";

const exec = promisify(cp_exec);

async function executeJjCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await exec(`jj ${command}`);
    if (stderr) {
      console.error(`Jujutsu command error: ${stderr}`);
      return `Error: ${stderr}`;
    }
    return stdout;
  } catch (error: any) {
    console.error(
      `Failed to execute Jujutsu command: ${command}, Error: ${error.message}`,
    );
    return `Error executing command: ${error.message}`;
  }
}

// Temporarily export executeJjCommand for testing purposes
export { executeJjCommand };

async function startJujutsuMcpServer() {
  const server = new McpServer({
    name: "jujutsu",
    version: "1.0.0", // Added missing version property
    description:
      "A Model Context Protocol server for interacting with Jujutsu version control.",
    tools: [
      {
        name: "jj_status",
        description:
          "Shows the current state of the working copy and the repo.",
        input_schema: {},
        handler: async () => {
          return { result: await executeJjCommand("status") };
        },
      },
      {
        name: "jj_log",
        description: "Shows the commit history.",
        input_schema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Limit the number of commits shown.",
            },
            branch: {
              type: "string",
              description: "Show commits on a specific branch.",
            },
          },
          additionalProperties: false,
        },
        handler: async (args: { limit?: number; branch?: string }) => {
          let command = "log";
          if (args.limit) {
            command += ` -n ${args.limit}`;
          }
          if (args.branch) {
            command += ` --branch=${args.branch}`;
          }
          return { result: await executeJjCommand(command) };
        },
      },
      {
        name: "jj_commit",
        description: "Creates a new commit.",
        input_schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The commit message.",
              default: "chore: new commit",
            },
          },
          additionalProperties: false,
        },
        handler: async (args: { message?: string }) => {
          const message = args.message || "chore: new commit";
          return { result: await executeJjCommand(`commit -m "${message}"`) };
        },
      },
      {
        name: "jj_branch",
        description: "Manage branches.",
        input_schema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["list", "create", "delete"],
              description:
                "Action to perform on branches (list, create, delete).",
            },
            name: {
              type: "string",
              description: "Branch name (required for create/delete actions).",
            },
          },
          required: ["action"],
          additionalProperties: false,
        },
        handler: async (args: {
          action: "list" | "create" | "delete";
          name?: string;
        }) => {
          let command: string;
          switch (args.action) {
            case "list":
              command = "branch list";
              break;
            case "create":
              if (!args.name)
                return {
                  result:
                    "Error: Branch name is required for creating a branch.",
                };
              command = `branch create ${args.name}`;
              break;
            case "delete":
              if (!args.name)
                return {
                  result:
                    "Error: Branch name is required for deleting a branch.",
                };
              command = `branch delete ${args.name}`;
              break;
            default:
              return { result: "Error: Invalid branch action." };
          }
          return { result: await executeJjCommand(command) };
        },
      },
    ],
    resources: [
      {
        uri: "jujutsu://info",
        description: "General information about the Jujutsu repository.",
        mime_type: "text/plain",
        handler: async () => {
          const status = await executeJjCommand("status");
          const log = await executeJjCommand("log -n 5");
          return `Jujutsu Repository Info:\n\nStatus:\n${status}\n\nRecent Log:\n${log}`;
        },
      },
    ],
  });

  const transport = new StdioServerTransport();
  server.connect(transport); // Changed from server.start() to server.connect()

  console.error("Jujutsu MCP Server started.");
}

// IMPORTANT!
// Only start the server if this script is run directly (not imported as a module)
if (require.main === module) {
  startJujutsuMcpServer();
}
