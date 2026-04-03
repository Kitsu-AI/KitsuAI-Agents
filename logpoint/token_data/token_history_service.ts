export interface TokenDataPoint {
  timestamp: number
  priceUsd: number
  volumeUsd: number
  marketCapUsd: number
}

export interface TokenSummary {
  symbol: string
  startTime: number
  endTime: number
  avgPriceUsd: number
  avgVolumeUsd: number
  avgMarketCapUsd: number
  minPriceUsd: number
  maxPriceUsd: number
}

export class TokenDataFetcher {
  constructor(private apiBase: string, private timeoutMs: number = 10_000) {}

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Fetches an array of TokenDataPoint for the given token symbol.
   * Expects endpoint: `${apiBase}/tokens/${symbol}/history`
   */
  async fetchHistory(symbol: string): Promise<TokenDataPoint[]> {
    const res = await this.fetchWithTimeout(
      `${this.apiBase}/tokens/${encodeURIComponent(symbol)}/history`
    )
    if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}: ${res.status}`)
    const raw = (await res.json()) as any[]
    return raw.map(r => ({
      timestamp: r.time * 1000,
      priceUsd: Number(r.priceUsd),
      volumeUsd: Number(r.volumeUsd),
      marketCapUsd: Number(r.marketCapUsd),
    }))
  }

  /**
   * Computes a summary from a series of TokenDataPoint
   */
  summarize(symbol: string, data: TokenDataPoint[]): TokenSummary | null {
    if (!data.length) return null
    const startTime = data[0].timestamp
    const endTime = data[data.length - 1].timestamp
    const totalPrice = data.reduce((s, p) => s + p.priceUsd, 0)
    const totalVolume = data.reduce((s, p) => s + p.volumeUsd, 0)
    const totalCap = data.reduce((s, p) => s + p.marketCapUsd, 0)
    const minPrice = Math.min(...data.map(p => p.priceUsd))
    const maxPrice = Math.max(...data.map(p => p.priceUsd))

    return {
      symbol,
      startTime,
      endTime,
      avgPriceUsd: Math.round((totalPrice / data.length) * 100) / 100,
      avgVolumeUsd: Math.round((totalVolume / data.length) * 100) / 100,
      avgMarketCapUsd: Math.round((totalCap / data.length) * 100) / 100,
      minPriceUsd: minPrice,
      maxPriceUsd: maxPrice,
    }
  }

  /**
   * Convenience: fetch + summarize in one step
   */
  async fetchAndSummarize(symbol: string): Promise<TokenSummary | null> {
    const data = await this.fetchHistory(symbol)
    return this.summarize(symbol, data)
  }
}
