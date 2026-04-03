import { z } from "zod"

/**
 * Base types for any action.
 */

export type ActionSchema = z.ZodObject<z.ZodRawShape>

/** Standardized action error payload */
export interface ActionError {
  code: string
  message: string
  details?: unknown
}

/** Standardized action response */
export interface ActionResponse<T> {
  ok: boolean
  notice: string
  data?: T
  error?: ActionError
  timestamp: number
}

/** Arguments passed to an action's execute method */
export interface ActionArgs<S extends ActionSchema, Ctx = unknown> {
  payload: z.infer<S>
  context: Ctx
}

/** Base action contract */
export interface BaseAction<S extends ActionSchema, R, Ctx = unknown> {
  /** Stable, human-readable identifier (no randomness) */
  id: string
  /** One-line summary of what the action does */
  summary: string
  /** Zod schema describing expected input */
  input: S
  /**
   * Execute the action
   * Implementations should not mutate incoming args
   */
  execute(args: ActionArgs<S, Ctx>): Promise<ActionResponse<R>>
}

/* ------------------------------------------------------------------ */
/* Helper builders                                                     */
/* ------------------------------------------------------------------ */

/** Build a success response */
export function successResponse<T>(data: T, notice = "ok"): ActionResponse<T> {
  return {
    ok: true,
    notice,
    data,
    timestamp: Date.now(),
  }
}

/** Build an error response */
export function errorResponse<T = never>(
  error: ActionError,
  notice = "error"
): ActionResponse<T> {
  return {
    ok: false,
    notice,
    error,
    timestamp: Date.now(),
  }
}

/** Narrower guard for ActionError */
export function isActionError(e: unknown): e is ActionError {
  if (!e || typeof e !== "object") return false
  const obj = e as Record<string, unknown>
  return typeof obj.code === "string" && typeof obj.message === "string"
}

/* ------------------------------------------------------------------ */
/* Abstract base with validation + safe execute                        */
/* ------------------------------------------------------------------ */

/**
 * AbstractAction provides a safe `execute` wrapper:
 * - validates input with Zod
 * - calls the subclass `run` method
 * - standardizes success/error responses
 */
export abstract class AbstractAction<S extends ActionSchema, R, Ctx = unknown>
  implements BaseAction<S, R, Ctx>
{
  constructor(
    public readonly id: string,
    public readonly summary: string,
    public readonly input: S
  ) {}

  /** Subclasses implement their core logic here */
  protected abstract run(args: ActionArgs<S, Ctx>): Promise<R>

  /** Validate payload then run, wrapping into standardized response */
  async execute(args: ActionArgs<S, Ctx>): Promise<ActionResponse<R>> {
    try {
      const payload = this.input.parse(args.payload) as z.infer<S>
      const result = await this.run({ payload, context: args.context })
      return successResponse<R>(result, "action executed")
    } catch (err: unknown) {
      if (isActionError(err)) {
        return errorResponse<R>(err, "action failed")
      }
      const message = err instanceof Error ? err.message : "Unknown error"
      return errorResponse<R>(
        { code: "EXECUTION_ERROR", message, details: err },
        "action failed"
      )
    }
  }
}
