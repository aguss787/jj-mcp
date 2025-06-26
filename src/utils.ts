import { exec as cp_exec } from "child_process";
import { promisify } from "util";

const exec = promisify(cp_exec);

async function executeJjCommand(
  command: string,
  workingDirectory: string,
): Promise<string> {
  try {
    const { stdout, stderr } = await exec(`jj ${command}`, {
      cwd: workingDirectory,
    });
    if (stderr) {
      return `stdout: ${stdout}\nstderr: ${stderr}`;
    }
    return stdout;
  } catch (error: any) {
    console.error(
      `Failed to execute Jujutsu command: ${command}, Error: ${error.message}`,
    );
    return `Error executing command: ${error.message}`;
  }
}

export { executeJjCommand };
