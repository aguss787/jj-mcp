import { z } from "zod";
import { executeJjCommand } from "../utils";
import { Tool } from "./types";

export const gitTools: Tool[] = [
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
        command += " -N";
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
        command += ` --remote ${args.remote.map((r: string) => `'${r}'`).join(" ")}`;
      }
      if (args.branch && args.branch.length > 0) {
        command += ` -b ${args.branch.map((b: string) => `'${b}'`).join(" ")}`;
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
