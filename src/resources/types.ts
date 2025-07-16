export type ResourceHandler = (uri: URL) => Promise<{
  contents: {
    uri: string;
    type: string;
    text: string;
  }[];
}>;

export interface Resource {
  name: string;
  uri: string;
  definition: {
    title: string;
    description: string;
    mime_type: string;
  };
  handler: ResourceHandler;
}
