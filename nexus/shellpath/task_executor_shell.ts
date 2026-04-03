import { execCommand } from "./exec_command"

export interface ShellTask {
  id: string
  command: string
  description?: string
  cwd?: string
  env?: Record<string, string>
  timeoutMs?: number
}

export interface ShellResult {
  taskId: string
  output?: string
  error?: string
  executedAt: number
  durationMs: number
}

export class ShellTaskRunner {
  private tasks: ShellTask[] = []

  /**
   * Schedule a shell task for execution.
   */
  scheduleTask(task: ShellTask): void {
    this.tasks.push(task)
  }

  /**
   * Execute all scheduled tasks in sequence.
   */
  async runAll(): Promise<ShellResult[]> {
    const results: ShellResult[] = []
    for (const task of this.tasks) {
      const start = Date.now()
      try {
        const output = await execCommand(
          task.command,
          task.timeoutMs ?? 30_000,
          task.cwd,
          task.env
        )
        results.push({
          taskId: task.id,
          output,
          executedAt: start,
          durationMs: Date.now() - start
        })
      } catch (err: any) {
        results.push({
          taskId: task.id,
          error: err.message ?? String(err),
          executedAt: start,
          durationMs: Date.now() - start
        })
      }
    }
    this.tasks = [] // clear after running
    return results
  }

  /**
   * Run only the next scheduled task (FIFO).
   */
  async runNext(): Promise<ShellResult | null> {
    const task = this.tasks.shift()
    if (!task) return null
    const start = Date.now()
    try {
      const output = await execCommand(
        task.command,
        task.timeoutMs ?? 30_000,
        task.cwd,
        task.env
      )
      return {
        taskId: task.id,
        output,
        executedAt: start,
        durationMs: Date.now() - start
      }
    } catch (err: any) {
      return {
        taskId: task.id,
        error: err.message ?? String(err),
        executedAt: start,
        durationMs: Date.now() - start
      }
    }
  }

  /**
   * Return the number of queued tasks.
   */
  count(): number {
    return this.tasks.length
  }

  /**
   * Clear all scheduled tasks without running them.
   */
  clear(): void {
    this.tasks = []
  }
}
