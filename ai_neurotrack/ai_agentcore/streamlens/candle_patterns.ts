import fetch from "node-fetch"

/*------------------------------------------------------
 * Types
 *----------------------------------------------------*/

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type CandlestickPattern =
  | "Hammer"
  | "ShootingStar"
  | "BullishEngulfing"
  | "BearishEngulfing"
  | "Doji"
  | "SpinningTop"

export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number
}

/*------------------------------------------------------
 * Detector
 *----------------------------------------------------*/

export class CandlestickPatternDetector {
  constructor(private readonly apiUrl: string) {}

  /** Fetch recent OHLC candles (supports timeframe like 1m,5m,1h,1d) */
  async fetchCandles(symbol: string, limit = 100, timeframe = "1m"): Promise<Candle[]> {
    const url = `${this.apiUrl}/markets/${encodeURIComponent(
      symbol
    )}/candles?limit=${limit}&timeframe=${encodeURIComponent(timeframe)}`
    const res = await fetch(url, { timeout: 10_000 })
    if (!res.ok) {
      throw new Error(`Failed to fetch candles ${res.status}: ${res.statusText}`)
    }
    const data = (await res.json()) as unknown
    if (!Array.isArray(data)) throw new Error("Unexpected candle response format")
    // light runtime guard
    return (data as any[]).map(c => ({
      timestamp: Number(c.timestamp ?? c.time ?? c.t),
      open: Number(c.open ?? c.o),
      high: Number(c.high ?? c.h),
      low: Number(c.low ?? c.l),
      close: Number(c.close ?? c.c),
      volume: c.volume !== undefined ? Number(c.volume) : undefined,
    })) as Candle[]
  }

  /* ------------------------- Pattern helpers ---------------------- */

  private isHammer(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const lowerWick = Math.min(c.open, c.close) - c.low
    const range = c.high - c.low
    const ratio = body > 0 ? lowerWick / body : 0
    return ratio > 2 && range > 0 && body / range < 0.3 ? Math.min(ratio / 3, 1) : 0
  }

  private isShootingStar(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const upperWick = c.high - Math.max(c.open, c.close)
    const range = c.high - c.low
    const ratio = body > 0 ? upperWick / body : 0
    return ratio > 2 && range > 0 && body / range < 0.3 ? Math.min(ratio / 3, 1) : 0
  }

  private isBullishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close > curr.open &&
      prev.close < prev.open &&
      curr.close > prev.open &&
      curr.open < prev.close
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    return bodyPrev > 0 ? Math.min(bodyCurr / bodyPrev, 1) : 0.8
  }

  private isBearishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close < curr.open &&
      prev.close > prev.open &&
      curr.open > prev.close &&
      curr.close < prev.open
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    return bodyPrev > 0 ? Math.min(bodyCurr / bodyPrev, 1) : 0.8
  }

  private isDoji(c: Candle): number {
    const range = c.high - c.low
    const body = Math.abs(c.close - c.open)
    const ratio = range > 0 ? body / range : 1
    return ratio < 0.1 ? 1 - ratio * 10 : 0
  }

  private isSpinningTop(c: Candle): number {
    const range = c.high - c.low
    const body = Math.abs(c.close - c.open)
    if (range <= 0) return 0
    const ratio = body / range
    // Small body, notable wicks on both ends
    return ratio >= 0.1 && ratio <= 0.3 ? 1 - Math.abs(0.2 - ratio) * 5 : 0
  }

  /* ------------------------- Public analysis ---------------------- */

  /** Detect patterns across a series of candles (uses adjacent context when needed) */
  detectPatterns(candles: Candle[]): PatternSignal[] {
    const signals: PatternSignal[] = []
    if (candles.length === 0) return signals

    for (let i = 0; i < candles.length; i++) {
      const curr = candles[i]
      const prev = candles[i - 1]

      const hammer = this.isHammer(curr)
      if (hammer > 0) signals.push({ timestamp: curr.timestamp, pattern: "Hammer", confidence: hammer })

      const shootingStar = this.isShootingStar(curr)
      if (shootingStar > 0) {
        signals.push({ timestamp: curr.timestamp, pattern: "ShootingStar", confidence: shootingStar })
      }

      if (prev) {
        const bull = this.isBullishEngulfing(prev, curr)
        if (bull > 0) signals.push({ timestamp: curr.timestamp, pattern: "BullishEngulfing", confidence: bull })

        const bear = this.isBearishEngulfing(prev, curr)
        if (bear > 0) signals.push({ timestamp: curr.timestamp, pattern: "BearishEngulfing", confidence: bear })
      }

      const doji = this.isDoji(curr)
      if (doji > 0) signals.push({ timestamp: curr.timestamp, pattern: "Doji", confidence: doji })

      const spinning = this.isSpinningTop(curr)
      if (spinning > 0) signals.push({ timestamp: curr.timestamp, pattern: "SpinningTop", confidence: spinning })
    }

    return signals
  }

  /** Convenience: fetch then detect */
  async fetchAndDetect(
    symbol: string,
    limit = 100,
    timeframe = "1m"
  ): Promise<{ candles: Candle[]; signals: PatternSignal[] }> {
    const candles = await this.fetchCandles(symbol, limit, timeframe)
    return { candles, signals: this.detectPatterns(candles) }
  }
}
