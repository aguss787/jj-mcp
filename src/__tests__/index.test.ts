import { executeJjCommand } from "../utils"; // Import the function to be tested
import { promisify } from "util";

// This line ensures that child_process is mocked globally for this test file.
// All subsequent imports/requires of 'child_process' will get the mocked version.
jest.mock("child_process", () => ({
  // Define the mock implementation for 'exec' directly within the mock factory.
  // We need to return an object with 'exec' as a jest.fn().
  exec: jest.fn((command, options, callback) => {
    // Adjust callback for optional options parameter
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    if (command.includes("jj status")) {
      callback(null, { stdout: "Working copy clean", stderr: "" });
    } else if (command.includes("jj log")) {
      callback(null, { stdout: "Mocked log output", stderr: "" });
    } else if (command.includes("jj commit")) {
      callback(null, { stdout: "Mocked commit output", stderr: "" });
    } else if (command.includes("jj branch list")) {
      callback(null, { stdout: "Mocked branch list output", stderr: "" });
    } else if (command.includes("jj branch create")) {
      callback(null, { stdout: "Mocked branch create output", stderr: "" });
    } else if (command.includes("jj branch delete")) {
      callback(null, { stdout: "Mocked branch delete output", stderr: "" });
    } else if (command.includes("jj diff")) {
      callback(null, { stdout: "Mocked diff output", stderr: "" });
    } else if (command.includes("jj init")) {
      callback(null, { stdout: "Mocked init output", stderr: "" });
    } else {
      callback(new Error("Unknown command"), {
        stdout: "",
        stderr: "Unknown command",
      });
    }
  }),
}));

// Now, after `jest.mock` has run, when we require 'child_process', we get the mocked version.
// We can then deconstruct 'exec' from it and promisify it.
const { exec } = require("child_process"); // Get the *mocked* exec
const cp_exec = promisify(exec); // Promisify the mocked exec

describe("Jujutsu MCP Server Tools", () => {
  beforeEach(() => {
    // Clear mock calls before each test using the mocked exec function.
    (exec as jest.Mock).mockClear();
    // The mock implementation is already defined in jest.mock factory, so no need to redefine it here
    // unless we want to change it for specific tests, which is not the case here.
  });

  test("jj_status tool should return status", async () => {
    const result = await executeJjCommand("status", ".");
    expect(result).toBe("Working copy clean");
    // Ensure the mocked exec was called with the correct command and a callback
    expect(exec).toHaveBeenCalledWith(
      "jj status",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_log tool should return log", async () => {
    const result = await executeJjCommand("log", ".");
    expect(result).toBe("Mocked log output");
    expect(exec).toHaveBeenCalledWith(
      "jj log",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_log tool with limit should return limited log", async () => {
    const result = await executeJjCommand("log -n 5", ".");
    expect(result).toBe("Mocked log output");
    expect(exec).toHaveBeenCalledWith(
      "jj log -n 5",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_log tool with branch should return branch log", async () => {
    const result = await executeJjCommand("log --branch=main", ".");
    expect(result).toBe("Mocked log output");
    expect(exec).toHaveBeenCalledWith(
      "jj log --branch=main",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_commit tool should create a commit", async () => {
    const result = await executeJjCommand('commit -m "Test commit"', ".");
    expect(result).toBe("Mocked commit output");
    expect(exec).toHaveBeenCalledWith(
      'jj commit -m "Test commit"',
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_branch tool list action", async () => {
    const result = await executeJjCommand("branch list", ".");
    expect(result).toBe("Mocked branch list output");
    expect(exec).toHaveBeenCalledWith(
      "jj branch list",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_branch tool create action", async () => {
    const result = await executeJjCommand("branch create my-branch", ".");
    expect(result).toBe("Mocked branch create output");
    expect(exec).toHaveBeenCalledWith(
      "jj branch create my-branch",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_branch tool delete action", async () => {
    const result = await executeJjCommand("branch delete old-branch", ".");
    expect(result).toBe("Mocked branch delete output");
    expect(exec).toHaveBeenCalledWith(
      "jj branch delete old-branch",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_diff tool should return diff", async () => {
    const result = await executeJjCommand("diff -r @", ".");
    expect(result).toBe("Mocked diff output");
    expect(exec).toHaveBeenCalledWith(
      "jj diff -r @",
      expect.any(Object),
      expect.any(Function),
    );
  });

  test("jj_init tool should initialize a repo", async () => {
    const result = await executeJjCommand("init", ".");
    expect(result).toBe("Mocked init output");
    expect(exec).toHaveBeenCalledWith(
      "jj init",
      expect.any(Object),
      expect.any(Function),
    );
  });
});
