import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startJujutsuMcpServer } from "../jujutsuMcpServer";
import { executeJjCommand } from "../utils";

const mockRegisterTool = jest.fn();
const mockRegisterResource = jest.fn();

jest.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: jest.fn(() => ({
    registerTool: mockRegisterTool,
    registerResource: mockRegisterResource,
    name: "mock-jujutsu",
    version: "1.0.0",
    description: "Mock Jujutsu MCP Server",
    resources: [],
  })),
}));

jest.mock("../utils", () => ({
  executeJjCommand: jest.fn((command: string, _workingDirectory: string) => {
    if (command.includes("status")) {
      return Promise.resolve("Mocked status output");
    }
    if (command.includes("--version")) {
      return Promise.resolve("jj 0.28.2");
    }
    if (command.includes("log")) {
      return Promise.resolve("Mocked log output");
    }
    return Promise.resolve("");
  }),
  as_base64_cmd: jest.requireActual("../utils").as_base64_cmd,
}));

describe("startJujutsuMcpServer", () => {
  beforeEach(async () => {
    // Reset the mock before each test
    mockRegisterTool.mockClear();
    mockRegisterResource.mockClear();
    (McpServer as jest.Mock).mockClear();

    await startJujutsuMcpServer();
  });

  test("should register jj_status tool", () => {
    // Check if registerTool was called for jj_status
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "jj_status",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("should handle jj_status tool request", async () => {
    const jjStatusRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_status",
    );

    if (!jjStatusRegistration) {
      throw new Error("jj_status tool was not registered.");
    }

    const jjStatusHandler = jjStatusRegistration[2];

    const input = { workingDirectory: "." };
    const result = await jjStatusHandler(input);

    expect(executeJjCommand).toHaveBeenCalledWith("status", ".");
    expect(result).toEqual({
      content: [{ type: "text", text: "Mocked status output" }],
    });
  });

  test("should register jj_commit tool", () => {
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "jj_commit",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("should handle jj_commit tool request", async () => {
    const jjCommitRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_commit",
    );

    if (!jjCommitRegistration) {
      throw new Error("jj_commit tool was not registered.");
    }

    const jjCommitHandler = jjCommitRegistration[2];

    const input = {
      message: "Test commit message",
      workingDirectory: "/path/to/repo",
    };
    const result = await jjCommitHandler(input);

    const base64Message = Buffer.from(input.message).toString("base64");

    expect(executeJjCommand).toHaveBeenCalledWith(
      `commit -m "$(echo ${base64Message} | base64 -d)"`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  test("should handle jj_commit tool request with multiline message", async () => {
    const jjCommitRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_commit",
    );

    if (!jjCommitRegistration) {
      throw new Error("jj_commit tool was not registered.");
    }

    const jjCommitHandler = jjCommitRegistration[2];

    const input = {
      message: "First line\nSecond line",
      workingDirectory: "/path/to/repo",
    };
    const result = await jjCommitHandler(input);

    const base64Message = Buffer.from(input.message).toString("base64");

    expect(executeJjCommand).toHaveBeenCalledWith(
      `commit -m "$(echo ${base64Message} | base64 -d)"`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  test("should handle jj_commit tool request with multiline message containing quotes", async () => {
    const jjCommitRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_commit",
    );

    if (!jjCommitRegistration) {
      throw new Error("jj_commit tool was not registered.");
    }

    const jjCommitHandler = jjCommitRegistration[2];

    const input = {
      message:
        "Fix: Update 'config' file\nAdded \"new feature\" support\nBump version to 2.0.0",
      workingDirectory: "/path/to/repo",
    };
    const result = await jjCommitHandler(input);

    const base64Message = Buffer.from(input.message).toString("base64");

    expect(executeJjCommand).toHaveBeenCalledWith(
      `commit -m "$(echo ${base64Message} | base64 -d)"`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  test("should register jj_bookmark_set tool", () => {
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "jj_bookmark_set",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("should handle jj_bookmark_set tool request", async () => {
    const jjBookmarkSetRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_bookmark_set",
    );

    if (!jjBookmarkSetRegistration) {
      throw new Error("jj_bookmark_set tool was not registered.");
    }

    const jjBookmarkSetHandler = jjBookmarkSetRegistration[2];

    const input = {
      names: ["my-bookmark"],
      revision_id: "abcde",
      allow_backwards: true,
      workingDirectory: "/path/to/repo",
    };
    const result = await jjBookmarkSetHandler(input);

    expect(executeJjCommand).toHaveBeenCalledWith(
      `bookmark set 'my-bookmark' -r 'abcde' -B`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  test("should register jj_diff tool", () => {
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "jj_diff",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("should handle jj_diff tool request with git flag true (explicit)", async () => {
    const jjDiffRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_diff",
    );

    if (!jjDiffRegistration) {
      throw new Error("jj_diff tool was not registered.");
    }

    const jjDiffHandler = jjDiffRegistration[2];

    const input = {
      revision_id: "@",
      git: true,
      workingDirectory: "/path/to/repo",
    };
    const result = await jjDiffHandler(input);

    expect(executeJjCommand).toHaveBeenCalledWith(
      `diff -r "@" --git`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  test("should handle jj_diff tool request with git flag false (explicit)", async () => {
    const jjDiffRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_diff",
    );

    if (!jjDiffRegistration) {
      throw new Error("jj_diff tool was not registered.");
    }

    const jjDiffHandler = jjDiffRegistration[2];

    const input = {
      revision_id: "@",
      git: false,
      workingDirectory: "/path/to/repo",
    };
    const result = await jjDiffHandler(input);

    expect(executeJjCommand).toHaveBeenCalledWith(
      `diff -r "@"`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  test("should handle jj_diff tool request with git flag missing (defaults to true)", async () => {
    const jjDiffRegistration = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0] === "jj_diff",
    );

    if (!jjDiffRegistration) {
      throw new Error("jj_diff tool was not registered.");
    }

    const jjDiffHandler = jjDiffRegistration[2];

    const input = {
      revision_id: "abc123",
      workingDirectory: "/path/to/repo",
      // git flag is intentionally missing
    };
    const result = await jjDiffHandler(input);

    expect(executeJjCommand).toHaveBeenCalledWith(
      `diff -r "abc123" --git`,
      "/path/to/repo",
    );
    expect(result).toEqual({ content: [{ type: "text", text: "" }] });
  });

  // Resource tests
  test("should register info resource", () => {
    expect(mockRegisterResource).toHaveBeenCalledWith(
      "info",
      "jujutsu://info",
      expect.objectContaining({
        title: "Jujutsu Info",
        description: "General information about the Jujutsu repository.",
        mime_type: "text/plain",
      }),
      expect.any(Function),
    );
  });

  test("should register version resource", () => {
    expect(mockRegisterResource).toHaveBeenCalledWith(
      "version",
      "jujutsu://version",
      expect.objectContaining({
        title: "Jujutsu Version",
        description: "Get the version of the Jujutsu binary.",
        mime_type: "text/plain",
      }),
      expect.any(Function),
    );
  });

  test("should handle version resource request", async () => {
    const versionResourceRegistration = mockRegisterResource.mock.calls.find(
      (call: any[]) => call[0] === "version",
    );

    if (!versionResourceRegistration) {
      throw new Error("version resource was not registered.");
    }

    const versionResourceHandler = versionResourceRegistration[3];
    const mockUri = new URL("jujutsu://version");

    const result = await versionResourceHandler(mockUri);

    expect(executeJjCommand).toHaveBeenCalledWith("--version", ".");
    expect(result).toEqual({
      contents: [
        {
          uri: "jujutsu://version",
          type: "text",
          text: "jj 0.28.2",
        },
      ],
    });
  });

  test("should handle info resource request", async () => {
    const infoResourceRegistration = mockRegisterResource.mock.calls.find(
      (call: any[]) => call[0] === "info",
    );

    if (!infoResourceRegistration) {
      throw new Error("info resource was not registered.");
    }

    const infoResourceHandler = infoResourceRegistration[3];
    const mockUri = new URL("jujutsu://info");

    const result = await infoResourceHandler(mockUri);

    expect(executeJjCommand).toHaveBeenCalledWith("status", ".");
    expect(executeJjCommand).toHaveBeenCalledWith(
      "log --limit 5 -T 'builtin_log_compact_full_description'",
      ".",
    );
    expect(result).toEqual({
      contents: [
        {
          uri: "jujutsu://info",
          type: "text",
          text: "Jujutsu Repository Info:\n\nStatus:\nMocked status output\n\nRecent Log:\nMocked log output",
        },
      ],
    });
  });
});
