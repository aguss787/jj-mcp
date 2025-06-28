import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startJujutsuMcpServer } from "../jujutsuMcpServer";
import { executeJjCommand } from "../utils";

const mockRegisterTool = jest.fn();

jest.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: jest.fn(() => ({
    registerTool: mockRegisterTool,
    registerResource: jest.fn(), // Mock registerResource as well if it's called
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
    return Promise.resolve("");
  }),
  as_base64_cmd: jest.requireActual("../utils").as_base64_cmd,
}));

describe("startJujutsuMcpServer", () => {
  beforeEach(async () => {
    // Reset the mock before each test
    mockRegisterTool.mockClear();
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
});
