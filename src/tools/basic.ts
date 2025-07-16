import { z } from "zod";
import { executeJjCommand, as_base64_cmd } from "../utils";
import { Tool } from "./types";

export const basicTools: Tool[] = [
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
        revisions: z
          .array(z.string())
          .optional()
          .describe("Revisions to show history for."),
        template: z
          .string()
          .optional()
          .describe(
            "A template to use for the output. The valid values are: [builtin_config_list, builtin_config_list_detailed, builtin_draft_commit_description, builtin_log_comfortable, builtin_log_compact, builtin_log_compact_full_description, builtin_log_detailed, builtin_log_node, builtin_log_node_ascii, builtin_log_oneline, builtin_op_log_comfortable, builtin_op_log_compact, builtin_op_log_node, builtin_op_log_node_ascii, builtin_op_log_oneline, commit_summary_separator, default_commit_description, description_placeholder, email_placeholder, git_format_patch_email_headers, name_placeholder]",
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
        command += ` --limit ${args.limit}`;
      }
      if (args.revisions && args.revisions.length > 0) {
        command += ` -r '${args.revisions.join(" ")}'`;
      }
      if (args.template) {
        command += ` -T '${args.template}'`;
      } else {
        command += ` -T 'builtin_log_compact_full_description'`;
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
        command += ` '${revision_id}'`;
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
        git: z
          .boolean()
          .default(true)
          .describe("Use git format for the diff output. Enabled by default."),
        workingDirectory: z
          .string()
          .min(1)
          .describe("Absolute path to the repository."),
      }).shape,
    },
    handler: async (args: any) => {
      const revision_id = args.revision_id;
      let command = `diff -r "${revision_id}"`;
      if (args.git !== false) {
        command += " --git";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
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
];
