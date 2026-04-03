export interface PricePoint {
  timestamp: number
  priceUsd: number
  volumeUsd?: number
}

export interface TrendResult {
  startTime: number
  endTime: number
  trend: "upward" | "downward" | "neutral"
  changePct: number
  avgPrice: number
  avgVolume?: number
}

/**
 * Analyze a series of price points to determine overall trend segments.
 */
export function analyzePriceTrends(
  points: PricePoint[],
  minSegmentLength: number = 5
): TrendResult[] {
  const results: TrendResult[] = []
  if (points.length < minSegmentLength) return results

  let segStart = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].priceUsd
    const curr = points[i].priceUsd
    const direction = curr > prev ? 1 : curr < prev ? -1 : 0

    // check if direction changes or segment length reached
    if (
      i - segStart >= minSegmentLength &&
      (i === points.length - 1 ||
        (direction === 1 && points[i + 1].priceUsd < curr) ||
        (direction === -1 && points[i + 1].priceUsd > curr))
    ) {
      const start = points[segStart]
      const end = points[i]
      const segment = points.slice(segStart, i + 1)

      const changePct = ((end.priceUsd - start.priceUsd) / start.priceUsd) * 100
      const avgPrice =
        segment.reduce((acc, p) => acc + p.priceUsd, 0) / segment.length
      const avgVolume = segment.some(p => p.volumeUsd !== undefined)
        ? segment.reduce((acc, p) => acc + (p.volumeUsd ?? 0), 0) /
          segment.length
        : undefined

      results.push({
        startTime: start.timestamp,
        endTime: end.timestamp,
        trend: changePct > 0 ? "upward" : changePct < 0 ? "downward" : "neutral",
        changePct: Math.round(changePct * 100) / 100,
        avgPrice: Math.round(avgPrice * 100) / 100,
        avgVolume: avgVolume ? Math.round(avgVolume * 100) / 100 : undefined,
      })
      segStart = i
    }
  }
  return results
}

/**
 * Utility: detect the strongest trend by absolute percentage change
 */
export function findStrongestTrend(results: TrendResult[]): TrendResult | null {
  if (!results.length) return null
  return results.reduce((max, curr) =>
    Math.abs(curr.changePct) > Math.abs(max.changePct) ? curr : max
  )
}

/**
 * Utility: flatten trend results into a summary
 */
export function summarizeTrends(results: TrendResult[]): {
  upward: number
  downward: number
  neutral: number
} {
  return results.reduce(
    (acc, r) => {
      acc[r.trend]++
      return acc
    },
    { upward: 0, downward: 0, neutral: 0 }
  )
}
