import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

/**
 * Toolkit exposing liquidity-related actions:
 * – fetch raw pool data
 * – run health / risk analysis on a liquidity pool
 * – list all available tool keys
 * – provide safe getter for tool by key
 */
export const LIQUIDITY_ANALYSIS_TOOLS: Record<string, Toolkit> = Object.freeze({
  [`liquidityscan-${FETCH_POOL_DATA_KEY}`]: toolkitBuilder(new FetchPoolDataAction()),
  [`poolhealth-${ANALYZE_POOL_HEALTH_KEY}`]: toolkitBuilder(new AnalyzePoolHealthAction()),
})

/** All available liquidity tool keys */
export const LIQUIDITY_TOOL_KEYS = Object.freeze(
  Object.keys(LIQUIDITY_ANALYSIS_TOOLS)
) as ReadonlyArray<string>

/** Retrieve a tool by key with runtime safety */
export function getLiquidityTool(key: string): Toolkit {
  if (!(key in LIQUIDITY_ANALYSIS_TOOLS)) {
    throw new Error(`Liquidity tool not found: ${key}`)
  }
  return LIQUIDITY_ANALYSIS_TOOLS[key]
}

/** Utility to check if a key corresponds to a valid tool */
export function hasLiquidityTool(key: string): boolean {
  return key in LIQUIDITY_ANALYSIS_TOOLS
}
