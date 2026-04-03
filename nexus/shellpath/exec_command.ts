import { exec } from "child_process"

/**
 * Execute a shell command and return stdout or throw on error.
 * @param command Shell command to run (e.g., "ls -la")
 * @param timeoutMs Optional timeout in milliseconds
 * @param cwd Optional working directory
 * @param env Optional environment variables
 */
export function execCommand(
  command: string,
  timeoutMs: number = 30_000,
  cwd?: string,
  env?: NodeJS.ProcessEnv
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(
      command,
      {
        timeout: timeoutMs,
        cwd,
        env: env ? { ...process.env, ...env } : process.env,
        maxBuffer: 10 * 1024 * 1024 // allow up to 10MB output
      },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Command failed [${command}]: ${stderr || error.message}`))
        }
        if (stderr) {
          // non-fatal warnings in stderr
          console.warn(`stderr from [${command}]:`, stderr.trim())
        }
        resolve(stdout.trim())
      }
    )

    // safeguard: handle child process errors
    proc.on("error", (err) => {
      reject(new Error(`Failed to start process: ${err.message}`))
    })
  })
}
