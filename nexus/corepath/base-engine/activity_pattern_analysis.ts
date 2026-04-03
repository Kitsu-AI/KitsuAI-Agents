/**
 * Detect volume-based patterns in a series of activity amounts.
 */
export interface PatternMatch {
  index: number
  window: number
  average: number
  max: number
  min: number
  deviation: number
}

export function detectVolumePatterns(
  volumes: number[],
  windowSize: number,
  threshold: number
): PatternMatch[] {
  const matches: PatternMatch[] = []
  if (windowSize <= 0 || volumes.length < windowSize) return matches

  for (let i = 0; i + windowSize <= volumes.length; i++) {
    const slice = volumes.slice(i, i + windowSize)
    const sum = slice.reduce((a, b) => a + b, 0)
    const avg = sum / windowSize
    const max = Math.max(...slice)
    const min = Math.min(...slice)
    const variance = slice.reduce((acc, v) => acc + (v - avg) ** 2, 0) / windowSize
    const deviation = Math.sqrt(variance)

    if (avg >= threshold) {
      matches.push({
        index: i,
        window: windowSize,
        average: Math.round(avg * 100) / 100,
        max,
        min,
        deviation: Math.round(deviation * 100) / 100,
      })
    }
  }
  return matches
}

/**
 * Summarize detected patterns
 */
export function summarizePatterns(matches: PatternMatch[]): {
  count: number
  strongest?: PatternMatch
} {
  if (!matches.length) return { count: 0 }
  const strongest = matches.reduce((a, b) => (b.average > a.average ? b : a))
  return { count: matches.length, strongest }
}
