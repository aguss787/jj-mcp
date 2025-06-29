import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeJjCommand, as_base64_cmd } from "./utils"; // Import from the new file

type ToolHandler = (args: any) => Promise<{
  content: { type: "text"; text: string }[];
}>;

interface Tool {
  name: string;
  definition: {
    title: string;
    description: string;
    inputSchema: any;
  };
  handler: ToolHandler;
}

type ResourceHandler = (uri: URL) => Promise<{
  contents: {
    uri: string;
    type: string;
    text: string;
  }[];
}>;

interface Resource {
  name: string;
  uri: string;
  definition: {
    title: string;
    description: string;
    mime_type: string;
  };
  handler: ResourceHandler;
}

const TOOLS: Tool[] = [
  {
    name: "jj_status",
    definition: {
      title: "Jujutsu Status",
      description: "Shows the current state of the working copy and the repo.",
      inputSchema: z.object({
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const result = await executeJjCommand("status", args.workingDirectory);
      return { content: [{ type: "text" as const, text: result }] };
    },
  },
  {
    name: "jj_log",
    definition: {
      title: "Jujutsu Log",
      description: "Shows the commit history.",
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .describe("Maximum number of commits to show."),
        branch: z.string().optional().describe("Branch to show history for."),
        template: z
          .string()
          .optional()
          .describe(
            "A template to use for the output. The valid values are: [builtin_log_compact_full_description, builtin_log_detailed]",
          ),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "log";
      if (args.limit) {
        command += ` -n ${args.limit}`;
      }
      if (args.branch) {
        command += ` --branch=${args.branch}`;
      }
      if (args.template) {
        command += ` --template='${args.template}'`;
      } else {
        command += ` --template='builtin_log_compact_full_description'`;
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text" as const, text: result }] };
    },
  },
  {
    name: "jj_commit",
    definition: {
      title: "Jujutsu Commit",
      description: "Creates a new commit.",
      inputSchema: z.object({
        message: z.string().describe("Message for the commit."),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "commit";
      if (args.message !== undefined && args.message !== null) {
        command += ` -m "${as_base64_cmd(args.message)}"`;
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text" as const, text: result }] };
    },
  },
  {
    name: "jj_desc",
    definition: {
      title: "Jujutsu Describe Commit",
      description: "Amends the description of the specified commit.",
      inputSchema: z.object({
        message: z
          .string()
          .default("")
          .describe(
            "New description for the commit. Defaults to empty if not provided.",
          ),
        revision_id: z
          .string()
          .optional()
          .describe(
            "The revision to describe. Defaults to the current working copy's parent if not provided.",
          ),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const message = args.message;
      const revision_id = args.revision_id;
      let command = "describe";
      command += ` -m "${as_base64_cmd(message)}"`;
      if (revision_id) {
        command += ` -r "${revision_id}"`;
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_bookmark",
    definition: {
      title: "Jujutsu Bookmark",
      description: "Manage bookmarks.",
      inputSchema: z.object({
        action: z
          .enum(["list", "create", "delete"])
          .describe(
            "Action to perform on bookmarks: 'list', 'create', or 'delete'.",
          ),
        name: z
          .string()
          .optional()
          .describe(
            "Name of the bookmark to create, delete, or list specific details for.",
          ),
        revision_id: z.string().describe("The revision to bookmark."),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command: string;
      switch (args.action) {
        case "list":
          command = "bookmark list";
          break;
        case "create":
          if (!args.name)
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: Bookmark name is required for creating a bookmark.",
                },
              ],
            };
          command = `bookmark create ${args.name} -r "${args.revision_id}"`;
          break;
        case "delete":
          if (!args.name)
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: Bookmark name is required for deleting a bookmark.",
                },
              ],
            };
          command = `bookmark delete ${args.name}`;
          break;
        default:
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: Invalid bookmark action.",
              },
            ],
          };
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_bookmark_set",
    definition: {
      title: "Jujutsu Bookmark Set",
      description: "Create or update a bookmark to point to a certain commit.",
      inputSchema: z.object({
        names: z.array(z.string()).min(1).describe("The bookmarks to update."),
        revision_id: z
          .string()
          .optional()
          .describe("The bookmark's target revision."),
        allow_backwards: z
          .boolean()
          .optional()
          .describe("Allow moving the bookmark backwards or sideways."),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "bookmark set";
      if (args.names && args.names.length > 0) {
        command += ` ${args.names.map((n: string) => `'${n}'`).join(" ")}`;
      }
      if (args.revision_id) {
        command += ` -r '${args.revision_id}'`;
      }
      if (args.allow_backwards) {
        command += " --allow-backwards";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_bookmark_move",
    definition: {
      title: "Jujutsu Bookmark Move",
      description: "Move existing bookmarks to a target revision.",
      inputSchema: z.object({
        names: z
          .array(z.string())
          .optional()
          .describe("Move bookmarks matching the given name patterns."),
        from: z
          .array(z.string())
          .optional()
          .describe("Move bookmarks from the given revisions."),
        to: z.string().describe("Move bookmarks to this revision."),
        allow_backwards: z
          .boolean()
          .optional()
          .describe("Allow moving bookmarks backwards or sideways."),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "bookmark move";
      if (args.names && args.names.length > 0) {
        command += ` ${args.names.map((n: string) => `'${n}'`).join(" ")}`;
      }
      if (args.from && args.from.length > 0) {
        command += ` --from ${args.from.map((f: string) => `'${f}'`).join(" ")}`;
      }
      command += ` --to '${args.to}'`;
      if (args.allow_backwards) {
        command += " --allow-backwards";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_diff",
    definition: {
      title: "Jujutsu Diff",
      description: "Shows the diff of the specified revision.",
      inputSchema: z.object({
        revision_id: z
          .string()
          .default("@")
          .describe(
            "The revision to show the diff for. Defaults to the working copy if not provided.",
          ),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const revision_id = args.revision_id;
      const result = await executeJjCommand(
        `diff -r "${revision_id}"`,
        args.workingDirectory,
      );
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_abandon",
    definition: {
      title: "Jujutsu Abandon",
      description: "Abandon the specified revision.",
      inputSchema: z.object({
        revision_id: z.string().min(1).describe("The revision to abandon."),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const revision_id = args.revision_id;
      const result = await executeJjCommand(
        `abandon -r "${revision_id}"`,
        args.workingDirectory,
      );
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_squash",
    definition: {
      title: "Jujutsu Squash",
      description: "Move changes from a revision into another revision.",
      inputSchema: z.object({
        revision: z
          .string()
          .optional()
          .describe("Revision to squash into its parent (default: @)"),
        into: z
          .string()
          .optional()
          .describe("Revision to squash into (default: @)"),
        from: z
          .array(z.string())
          .optional()
          .describe("Revision(s) to squash from (default: @)"),
        filesets: z
          .array(z.string())
          .optional()
          .describe("Move only changes to these paths (instead of all paths)"),
        tool: z
          .string()
          .optional()
          .describe("Specify diff editor to be used (implies --interactive)"),
        message: z
          .string()
          .describe(
            "The description to use for squashed revision (don't open editor)",
          ),
        keep_emptied: z
          .boolean()
          .optional()
          .describe("The source revision will not be abandoned"),
        use_destination_message: z
          .boolean()
          .optional()
          .describe(
            "Use the description of the destination revision and discard the description(s) of the source revision(s)",
          ),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "squash";
      if (args.revision) {
        command += ` -r '${args.revision}'`;
      }
      if (args.into) {
        command += ` --into '${args.into}'`;
      }
      if (args.from && args.from.length > 0) {
        command += ` --from ${args.from.map((f: string) => `'${f}'`).join(" ")}`;
      }
      if (args.filesets && args.filesets.length > 0) {
        command += ` --filesets ${args.filesets.map((f: string) => `'${f}'`).join(" ")}`;
      }
      if (args.tool) {
        command += ` --tool '${args.tool}'`;
      }
      if (args.message) {
        command += ` -m "${as_base64_cmd(args.message)}"`;
      }
      if (args.keep_emptied) {
        command += " --keep-emptied";
      }
      if (args.use_destination_message) {
        command += " --use-destination-message";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_rebase",
    definition: {
      title: "Jujutsu Rebase",
      description: "Move revisions to different parent(s).",
      inputSchema: z.object({
        source: z
          .array(z.string())
          .optional()
          .describe(
            "Rebase specified revision(s) together with their trees of descendants (can be repeated)",
          ),
        branch: z
          .array(z.string())
          .optional()
          .describe(
            "Rebase the whole branch relative to destination's ancestors (can be repeated)",
          ),
        revisions: z
          .array(z.string())
          .optional()
          .describe(
            "Rebase the given revisions, rebasing descendants onto this revision's parent(s)",
          ),
        destination: z
          .array(z.string())
          .optional()
          .describe(
            "The revision(s) to rebase onto (can be repeated to create a merge commit)",
          ),
        insert_before: z
          .array(z.string())
          .optional()
          .describe(
            "The revision(s) to insert before (can be repeated to create a merge commit)",
          ),
        insert_after: z
          .array(z.string())
          .optional()
          .describe(
            "The revision(s) to insert after (can be repeated to create a merge commit)",
          ),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "rebase";

      if (args.source && args.source.length > 0) {
        command += ` -s ${args.source.map((s: string) => `'${s}'`).join(" ")}`;
      }
      if (args.branch && args.branch.length > 0) {
        command += ` -b ${args.branch.map((b: string) => `'${b}'`).join(" ")}`;
      }
      if (args.revisions && args.revisions.length > 0) {
        command += ` -r ${args.revisions.map((r: string) => `'${r}'`).join(" ")}`;
      }
      if (args.destination && args.destination.length > 0) {
        command += ` -d ${args.destination.map((d: string) => `'${d}'`).join(" ")}`;
      }
      if (args.insert_before && args.insert_before.length > 0) {
        command += ` --insert-before ${args.insert_before.map((ib: string) => `'${ib}'`).join(" ")}`;
      }
      if (args.insert_after && args.insert_after.length > 0) {
        command += ` --insert-after ${args.insert_after.map((ia: string) => `'${ia}'`).join(" ")}`;
      }

      if (
        !args.source &&
        !args.branch &&
        !args.revisions &&
        !args.destination &&
        !args.insert_before &&
        !args.insert_after
      ) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: At least one of --source, --branch, --revisions, --destination, --insert-before, or --insert-after must be provided.",
            },
          ],
        };
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_push",
    definition: {
      title: "Jujutsu Git Push",
      description: "Push to a Git remote.",
      inputSchema: z.object({
        remote: z
          .string()
          .optional()
          .describe("The remote to push to (only named remotes are supported)"),
        revisions: z
          .array(z.string())
          .optional()
          .describe(
            "Push bookmarks pointing to these commits (can be repeated)",
          ),
        bookmark: z
          .array(z.string())
          .optional()
          .describe(
            "Push only this bookmark, or bookmarks matching a pattern (can be repeated)",
          ),
        change: z
          .array(z.string())
          .optional()
          .describe(
            "Push this commit by creating a bookmark based on its change ID (can be repeated)",
          ),
        named: z
          .array(z.string())
          .optional()
          .describe(
            "Specify a new bookmark name and a revision to push under that name, e.g. '--named myfeature=@'",
          ),
        all: z
          .boolean()
          .optional()
          .describe("Push all bookmarks (including new bookmarks)"),
        tracked: z.boolean().optional().describe("Push all tracked bookmarks"),
        deleted: z.boolean().optional().describe("Push all deleted bookmarks"),
        allow_empty_description: z
          .boolean()
          .optional()
          .describe("Allow pushing commits with empty descriptions"),
        allow_new: z
          .boolean()
          .optional()
          .describe("Allow pushing new bookmarks"),
        allow_private: z
          .boolean()
          .optional()
          .describe("Allow pushing commits that are private"),
        dry_run: z
          .boolean()
          .optional()
          .describe("Only display what will change on the remote"),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "git push";
      if (args.remote) {
        command += ` --remote '${args.remote}'`;
      }
      if (args.revisions && args.revisions.length > 0) {
        for (const revision of args.revisions) {
          command += ` -r '${revision}'`;
        }
      }
      if (args.bookmark && args.bookmark.length > 0) {
        for (const bookmark of args.bookmark) {
          command += ` -b '${bookmark}'`;
        }
      }
      if (args.change && args.change.length > 0) {
        for (const change of args.change) {
          command += ` -c '${change}'`;
        }
      }
      if (args.named && args.named.length > 0) {
        for (const named_entry of args.named) {
          command += ` --named '${named_entry}'`;
        }
      }
      if (args.all) {
        command += " --all";
      }
      if (args.tracked) {
        command += " --tracked";
      }
      if (args.deleted) {
        command += " --deleted";
      }
      if (args.allow_empty_description) {
        command += " --allow-empty-description";
      }
      if (args.allow_new) {
        command += " --allow-new";
      }
      if (args.allow_private) {
        command += " --allow-private";
      }
      if (args.dry_run) {
        command += " --dry-run";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_fetch",
    definition: {
      title: "Jujutsu Git Fetch",
      description: "Fetch from a Git remote.",
      inputSchema: z.object({
        remote: z
          .array(z.string())
          .optional()
          .describe(
            "The remote to fetch from (only named remotes are supported, can be repeated). This defaults to the `git.fetch` setting. If that is not configured, and if there are multiple remotes, the remote named \"origin\" will be used. By default, the specified remote names matches exactly. Use a [string pattern], e.g. `--remote 'glob:*'`, to select remotes using patterns.",
          ),
        branch: z
          .array(z.string())
          .optional()
          .describe(
            "Fetch only some of the branches. By default, the specified name matches exactly. Use `glob:` prefix to expand `*` as a glob, e.g. `--branch 'glob:push-*'. Other wildcard characters such as `?` are *not* supported.",
          ),
        all_remotes: z.boolean().optional().describe("Fetch from all remotes"),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      let command = "git fetch";
      if (args.remote && args.remote.length > 0) {
        command += ` ${args.remote.map((r: string) => `'${r}'`).join(" ")}`;
      }
      if (args.branch && args.branch.length > 0) {
        command += ` --branch ${args.branch.map((b: string) => `'${b}'`).join(" ")}`;
      }
      if (args.all_remotes) {
        command += " --all-remotes";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_remote_add",
    definition: {
      title: "Jujutsu Git Remote Add",
      description: "Add a Git remote.",
      inputSchema: z.object({
        remote: z.string().min(1).describe("The remote's name"),
        url: z.string().min(1).describe("The remote's URL or path"),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const command = `git remote add '${args.remote}' '${args.url}'`;
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_remote_list",
    definition: {
      title: "Jujutsu Git Remote List",
      description: "List Git remotes.",
      inputSchema: z.object({
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const command = "git remote list";
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_remote_remove",
    definition: {
      title: "Jujutsu Git Remote Remove",
      description: "Remove a Git remote and forget its bookmarks.",
      inputSchema: z.object({
        remote: z.string().min(1).describe("The remote's name"),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const command = `git remote remove '${args.remote}'`;
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_remote_rename",
    definition: {
      title: "Jujutsu Git Remote Rename",
      description: "Rename a Git remote.",
      inputSchema: z.object({
        old_name: z.string().min(1).describe("The name of an existing remote"),
        new_name: z.string().min(1).describe("The desired name for the remote"),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const command = `git remote rename '${args.old_name}' '${args.new_name}'`;
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
  {
    name: "jj_git_remote_set_url",
    definition: {
      title: "Jujutsu Git Remote Set URL",
      description: "Set the URL of a Git remote.",
      inputSchema: z.object({
        remote: z.string().min(1).describe("The remote's name"),
        url: z
          .string()
          .min(1)
          .describe("The desired URL or path for the remote"),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const command = `git remote set-url '${args.remote}' '${args.url}'`;
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
];

const RESOURCES: Resource[] = [
  {
    name: "info",
    uri: "jujutsu://info",
    definition: {
      title: "Jujutsu Info",
      description: "General information about the Jujutsu repository.",
      mime_type: "text/plain",
    },
    handler: async (uri: URL) => {
      const status = await executeJjCommand("status", ".");
      const log = await executeJjCommand(
        "log -n 5 --template='builtin_log_compact_full_description'",
        ".",
      );
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
  },
];

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
