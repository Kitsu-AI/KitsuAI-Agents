import { TokenActivityAnalyzer } from "./token_activity_analyzer"
import { TokenDepthAnalyzer } from "./token_depth_analyzer"
import { detectVolumePatterns } from "./volume_pattern_detector"
import { ExecutionEngine } from "./execution_engine"
import { SigningEngine } from "./signing_engine"

type VolumeAmount = number

interface RunConfig {
  rpcEndpoint: string
  dexApiBase: string
  mint: string
  market: string
  activityLimit: number
  depthWindow: number
  patternWindow: number
  patternThreshold: number
}

const CONFIG: RunConfig = {
  rpcEndpoint: "https://solana.rpc",
  dexApiBase: "https://dex.api",
  mint: "MintPubkeyHere",
  market: "MarketPubkeyHere",
  activityLimit: 20,
  depthWindow: 30,
  patternWindow: 5,
  patternThreshold: 100
}

function nowISO(): string {
  return new Date().toISOString()
}

function requireNonEmpty<T>(arr: T[], name: string): T[] {
  if (!arr.length) throw new Error(`${name} is empty`)
  return arr
}

async function main(): Promise<void> {
  const t0 = performance.now()
  console.log(`[${nowISO()}] run:start`, { mint: CONFIG.mint, market: CONFIG.market })

  // 1) Analyze activity
  const activityAnalyzer = new TokenActivityAnalyzer(CONFIG.rpcEndpoint)
  const records = await activityAnalyzer.analyzeActivity(CONFIG.mint, CONFIG.activityLimit)
  requireNonEmpty(records, "activity records")

  // 2) Analyze depth
  const depthAnalyzer = new TokenDepthAnalyzer(CONFIG.dexApiBase, CONFIG.market)
  const depthMetrics = await depthAnalyzer.analyze(CONFIG.depthWindow)

  // 3) Detect patterns
  const volumes: VolumeAmount[] = records.map(r => r.amount)
  const patterns = detectVolumePatterns(volumes, CONFIG.patternWindow, CONFIG.patternThreshold)

  // 4) Execute a custom task
  const engine = new ExecutionEngine()
  engine.register("report", async (params: { records: unknown[] }) => ({ records: params.records.length }))
  engine.enqueue("task1", "report", { records })
  const taskResults = await engine.runAll()

  // 5) Sign the results
  const signer = new SigningEngine()
  const payload = JSON.stringify({ depthMetrics, patterns, taskResults })
  const signature = await signer.sign(payload)
  const signatureValid = await signer.verify(payload, signature)
  if (!signatureValid) {
    throw new Error("Signature verification failed")
  }

  const t1 = performance.now()
  console.log(`[${nowISO()}] run:done`, {
    records: records.length,
    patterns: Array.isArray(patterns) ? patterns.length : 0,
    taskResults,
    signatureValid,
    elapsedMs: Math.round(t1 - t0)
  })
}

// Execute with top-level IIFE and robust error handling
;(async () => {
  try {
    await main()
  } catch (err) {
    console.error(`[${nowISO()}] run:error`, { message: (err as Error).message })
  }
})()
