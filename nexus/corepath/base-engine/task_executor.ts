/**
 * Simple task executor: registers and runs tasks by name.
 */
export type Handler = (params: any) => Promise<any>

export interface Task {
  id: string
  type: string
  params: any
  retries?: number
}

export class ExecutionEngine {
  private handlers: Record<string, Handler> = {}
  private queue: Task[] = []
  private running = false

  register(type: string, handler: Handler): void {
    this.handlers[type] = handler
  }

  enqueue(id: string, type: string, params: any, retries: number = 0): void {
    if (!this.handlers[type]) throw new Error(`No handler for ${type}`)
    this.queue.push({ id, type, params, retries })
  }

  async runAll(): Promise<Array<{ id: string; result?: any; error?: string }>> {
    const results: Array<{ id: string; result?: any; error?: string }> = []
    this.running = true
    while (this.queue.length) {
      const task = this.queue.shift()!
      try {
        const data = await this.handlers[task.type](task.params)
        results.push({ id: task.id, result: data })
      } catch (err: any) {
        if (task.retries && task.retries > 0) {
          this.queue.push({ ...task, retries: task.retries - 1 })
          continue
        }
        results.push({ id: task.id, error: err.message ?? String(err) })
      }
    }
    this.running = false
    return results
  }

  async runNext(): Promise<{ id: string; result?: any; error?: string } | null> {
    const task = this.queue.shift()
    if (!task) return null
    try {
      const data = await this.handlers[task.type](task.params)
      return { id: task.id, result: data }
    } catch (err: any) {
      return { id: task.id, error: err.message ?? String(err) }
    }
  }

  hasPending(): boolean {
    return this.queue.length > 0
  }

  isRunning(): boolean {
    return this.running
  }

  clear(): void {
    this.queue = []
  }
}
