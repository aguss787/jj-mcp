import { exec as cp_exec } from "child_process";
import { promisify } from "util";

const exec = promisify(cp_exec);

export async function executeJjCommand(
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

export function as_base64_cmd(message: string): string {
  const base64Message = Buffer.from(message).toString("base64");
  return `$(echo ${base64Message} | base64 -d)`;
}
