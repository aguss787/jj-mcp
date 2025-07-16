export type ToolHandler = (args: any) => Promise<{
  content: { type: "text"; text: string }[];
}>;

export interface Tool {
  name: string;
  definition: {
    title: string;
    description: string;
    inputSchema: any;
  };
  handler: ToolHandler;
}
