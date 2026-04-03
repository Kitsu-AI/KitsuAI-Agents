export interface PairInfo {
  exchange: string
  pairAddress: string
  baseSymbol: string
  quoteSymbol: string
  liquidityUsd: number
  volume24hUsd: number
  priceUsd: number
}

export type ApiConfig = {
  name: string
  baseUrl: string
  apiKey?: string
  headers?: Record<string, string>
}

export interface DexSuiteConfig {
  apis: ApiConfig[]
  timeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
}

type RawPairResponse = {
  token0?: { symbol?: string }
  token1?: { symbol?: string }
  liquidityUsd?: number | string
  volume24hUsd?: number | string
  priceUsd?: number | string
}

export class ApiError extends Error {
  constructor(
    public readonly apiName: string,
    public readonly path: string,
    public readonly status: number
  ) {
    super(`${apiName} ${path} ${status}`)
  }
}

/** deterministic delay helper */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class DexSuite {
  private readonly timeoutMs: number
  private readonly retryAttempts: number
  private readonly retryDelayMs: number

  constructor(private config: DexSuiteConfig) {
    this.timeoutMs = config.timeoutMs ?? 10_000
    this.retryAttempts = Math.max(0, config.retryAttempts ?? 1)
    this.retryDelayMs = Math.max(0, config.retryDelayMs ?? 400)
  }

  private buildHeaders(api: ApiConfig): HeadersInit {
    const headers: Record<string, string> = { ...(api.headers ?? {}) }
    if (api.apiKey) headers.Authorization = `Bearer ${api.apiKey}`
    return headers
  }

  private async fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(input, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  private async fetchFromApi<T>(
    api: ApiConfig,
    path: string,
    attempts = this.retryAttempts
  ): Promise<T> {
    const url = `${api.baseUrl.replace(/\/+$/, "")}${path}`
    let lastErr: unknown
    for (let i = 0; i <= attempts; i++) {
      try {
        const res = await this.fetchWithTimeout(
          url,
          { headers: this.buildHeaders(api) },
          this.timeoutMs
        )
        if (!res.ok) throw new ApiError(api.name, path, res.status)
        return (await res.json()) as T
      } catch (err) {
        lastErr = err
        if (i < attempts) await sleep(this.retryDelayMs)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  private normalizePair(api: ApiConfig, pairAddress: string, raw: RawPairResponse): PairInfo | null {
    const baseSymbol = raw.token0?.symbol
    const quoteSymbol = raw.token1?.symbol
    const liquidityUsd = Number(raw.liquidityUsd)
    const volume24hUsd = Number(raw.volume24hUsd)
    const priceUsd = Number(raw.priceUsd)

    if (!baseSymbol || !quoteSymbol) return null
    if (!Number.isFinite(liquidityUsd) || !Number.isFinite(volume24hUsd) || !Number.isFinite(priceUsd)) return null

    return {
      exchange: api.name,
      pairAddress,
      baseSymbol,
      quoteSymbol,
      liquidityUsd,
      volume24hUsd,
      priceUsd,
    }
  }

  /**
   * Retrieve aggregated pair info across all configured DEX APIs.
   * @param pairAddress Blockchain address of the trading pair
   */
  async getPairInfo(pairAddress: string): Promise<PairInfo[]> {
    const tasks = this.config.apis.map(async api => {
      try {
        const data = await this.fetchFromApi<RawPairResponse>(api, `/pair/${pairAddress}`)
        return this.normalizePair(api, pairAddress, data)
      } catch {
        return null
      }
    })

    const settled = await Promise.allSettled(tasks)
    const results: PairInfo[] = []
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) results.push(s.value)
    }
    return results
  }

  /** pick item with max value by selector (assumes non-empty array) */
  private maxBy<T>(arr: T[], sel: (x: T) => number): T {
    let best = arr[0]
    let bestVal = sel(best)
    for (let i = 1; i < arr.length; i++) {
      const v = sel(arr[i])
      if (v > bestVal) {
        best = arr[i]
        bestVal = v
      }
    }
    return best
  }

  /**
   * Compare a list of pairs across exchanges, returning the best volume and liquidity.
   */
  async comparePairs(
    pairs: string[]
  ): Promise<Record<string, { bestVolume?: PairInfo; bestLiquidity?: PairInfo }>> {
    const entries = await Promise.all(
      pairs.map(async addr => {
        const infos = await this.getPairInfo(addr)
        if (!infos.length) return [addr, { bestVolume: undefined, bestLiquidity: undefined }] as const
        const bestVolume = this.maxBy(infos, i => i.volume24hUsd)
        const bestLiquidity = this.maxBy(infos, i => i.liquidityUsd)
        return [addr, { bestVolume, bestLiquidity }] as const
      })
    )
    return Object.fromEntries(entries)
  }

  /**
   * Aggregate stats for a single pair across APIs
   */
  async aggregatePairStats(pairAddress: string): Promise<{
    pairAddress: string
    exchanges: number
    totalLiquidityUsd: number
    totalVolume24hUsd: number
    avgPriceUsd: number
  }> {
    const infos = await this.getPairInfo(pairAddress)
    if (!infos.length) {
      return {
        pairAddress,
        exchanges: 0,
        totalLiquidityUsd: 0,
        totalVolume24hUsd: 0,
        avgPriceUsd: 0,
      }
    }
    const totalLiquidityUsd = infos.reduce((s, r) => s + r.liquidityUsd, 0)
    const totalVolume24hUsd = infos.reduce((s, r) => s + r.volume24hUsd, 0)
    const avgPriceUsd = infos.reduce((s, r) => s + r.priceUsd, 0) / infos.length
    return {
      pairAddress,
      exchanges: infos.length,
      totalLiquidityUsd: Math.round(totalLiquidityUsd * 100) / 100,
      totalVolume24hUsd: Math.round(totalVolume24hUsd * 100) / 100,
      avgPriceUsd: Math.round(avgPriceUsd * 100) / 100,
    }
  }
}
