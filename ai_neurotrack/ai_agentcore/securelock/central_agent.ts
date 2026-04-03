import type { BaseAction, ActionResponse, ActionArgs } from "./action_base"
import { z } from "zod"

export interface AgentContext {
  apiEndpoint: string
  apiKey: string
  metadata?: Record<string, unknown>
}

/**
 * Central Agent: routes calls to registered actions.
 */
export class Agent {
  private actions = new Map<string, BaseAction<any, any, AgentContext>>()

  /** Register a new action */
  register<S extends z.ZodObject<any>, R>(
    action: BaseAction<S, R, AgentContext>
  ): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Action with id "${action.id}" already registered`)
    }
    this.actions.set(action.id, action)
  }

  /** Check if an action exists */
  hasAction(actionId: string): boolean {
    return this.actions.has(actionId)
  }

  /** List all registered action ids */
  listActionIds(): string[] {
    return Array.from(this.actions.keys())
  }

  /** Invoke an action by id */
  async invoke<R>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const action = this.actions.get(actionId)
    if (!action) {
      return {
        ok: false,
        notice: "action not found",
        error: { code: "NOT_FOUND", message: `Unknown action "${actionId}"` },
        timestamp: Date.now(),
      }
    }

    try {
      const args: ActionArgs<any, AgentContext> = { payload, context: ctx }
      return (await action.execute(args)) as ActionResponse<R>
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return {
        ok: false,
        notice: "action invocation failed",
        error: { code: "EXEC_ERROR", message, details: err },
        timestamp: Date.now(),
      }
    }
  }

  /** Remove a registered action */
  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  /** Clear all registered actions */
  clear(): void {
    this.actions.clear()
  }
}
