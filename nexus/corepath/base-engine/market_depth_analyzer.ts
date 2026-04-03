/**
 * Analyze on-chain orderbook depth for a given market.
 */

export interface Order {
  price: number
  size: number
}

export interface DepthMetrics {
  averageBidDepth: number
  averageAskDepth: number
  spread: number
  totalBidVolume: number
  totalAskVolume: number
  midPrice: number
  imbalance: number
}

export class TokenDepthAnalyzer {
  constructor(private rpcEndpoint: string, private marketId: string) {}

  private async fetchJson<T>(url: string, timeoutMs = 10_000): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`Orderbook fetch failed: ${res.status}`)
      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  async fetchOrderbook(depth = 50): Promise<{ bids: Order[]; asks: Order[] }> {
    const url = `${this.rpcEndpoint.replace(/\/+$/, "")}/orderbook/${this.marketId}?depth=${depth}`
    return this.fetchJson<{ bids: Order[]; asks: Order[] }>(url)
  }

  async analyze(depth = 50): Promise<DepthMetrics> {
    const { bids, asks } = await this.fetchOrderbook(depth)

    const avg = (arr: Order[]) =>
      arr.length ? arr.reduce((s, o) => s + o.size, 0) / arr.length : 0

    const totalBidVolume = bids.reduce((s, o) => s + o.size, 0)
    const totalAskVolume = asks.reduce((s, o) => s + o.size, 0)
    const bestBid = bids[0]?.price ?? 0
    const bestAsk = asks[0]?.price ?? 0
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0
    const imbalance =
      totalBidVolume + totalAskVolume > 0
        ? (totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume)
        : 0

    return {
      averageBidDepth: avg(bids),
      averageAskDepth: avg(asks),
      spread: bestAsk - bestBid,
      totalBidVolume,
      totalAskVolume,
      midPrice,
      imbalance,
    }
  }
}
