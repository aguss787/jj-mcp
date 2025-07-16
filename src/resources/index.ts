import { executeJjCommand } from "../utils";
import { Resource } from "./types";

export const RESOURCES: Resource[] = [
  {
    name: "version",
    uri: "jujutsu://version",
    definition: {
      title: "Jujutsu Version",
      description: "Get the version of the Jujutsu binary.",
      mime_type: "text/plain",
    },
    handler: async (uri: URL) => {
      const version = await executeJjCommand("--version", ".");
      return {
        contents: [
          {
            uri: uri.href,
            type: "text",
            text: version,
          },
        ],
      };
    },
  },
];
