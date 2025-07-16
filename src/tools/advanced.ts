import { z } from "zod";
import { executeJjCommand, as_base64_cmd } from "../utils";
import { Tool } from "./types";

export const advancedTools: Tool[] = [
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
        command += ` -t '${args.into}'`;
      }
      if (args.from && args.from.length > 0) {
        command += ` -f ${args.from.map((f: string) => `'${f}'`).join(" ")}`;
      }
      if (args.filesets && args.filesets.length > 0) {
        command += ` ${args.filesets.map((f: string) => `'${f}'`).join(" ")}`;
      }
      if (args.tool) {
        command += ` --tool '${args.tool}'`;
      }
      if (args.message) {
        command += ` -m "${as_base64_cmd(args.message)}"`;
      }
      if (args.keep_emptied) {
        command += " -k";
      }
      if (args.use_destination_message) {
        command += " -u";
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
];
