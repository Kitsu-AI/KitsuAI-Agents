import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

/**
 * Extended liquidity toolkit exposing:
 * – fetch raw pool data
 * – analyze pool health
 * – list all available keys
 * – retrieve tools safely
 */
export const EXTENDED_LIQUIDITY_TOOLS: Record<string, Toolkit> = Object.freeze({
  [`liquidityscan-${FETCH_POOL_DATA_KEY}`]: toolkitBuilder(new FetchPoolDataAction()),
  [`poolhealth-${ANALYZE_POOL_HEALTH_KEY}`]: toolkitBuilder(new AnalyzePoolHealthAction()),
})

/** List of available tool keys */
export const EXTENDED_LIQUIDITY_TOOL_KEYS = Object.freeze(
  Object.keys(EXTENDED_LIQUIDITY_TOOLS)
) as ReadonlyArray<string>

/** Retrieve a specific liquidity tool by key */
export function getExtendedLiquidityTool(key: string): Toolkit {
  if (!(key in EXTENDED_LIQUIDITY_TOOLS)) {
    throw new Error(`Unknown liquidity tool key: ${key}`)
  }
  return EXTENDED_LIQUIDITY_TOOLS[key]
}

/** Check if a liquidity tool exists */
export function hasExtendedLiquidityTool(key: string): boolean {
  return key in EXTENDED_LIQUIDITY_TOOLS
}
