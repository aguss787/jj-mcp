import { basicTools } from "./basic";
import { bookmarkTools } from "./bookmarks";
import { advancedTools } from "./advanced";
import { gitTools } from "./git";
import { Tool } from "./types";

export const TOOLS: Tool[] = [
  ...basicTools,
  ...bookmarkTools,
  ...advancedTools,
  ...gitTools,
];

export * from "./types";
export { basicTools, bookmarkTools, advancedTools, gitTools };
