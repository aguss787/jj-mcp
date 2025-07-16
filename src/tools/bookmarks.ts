import { z } from "zod";
import { executeJjCommand } from "../utils";
import { Tool } from "./types";

export const bookmarkTools: Tool[] = [
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
        revision_id: z
          .string()
          .optional()
          .describe("The revision to bookmark."),
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
          command = `bookmark create ${args.name}`;
          if (args.revision_id) {
            command += ` -r "${args.revision_id}"`;
          }
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
        command += " -B";
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
        command += ` -f ${args.from.map((f: string) => `'${f}'`).join(" ")}`;
      }
      command += ` -t '${args.to}'`;
      if (args.allow_backwards) {
        command += " -B";
      }
      const result = await executeJjCommand(command, args.workingDirectory);
      return { content: [{ type: "text", text: result }] };
    },
  },
];
