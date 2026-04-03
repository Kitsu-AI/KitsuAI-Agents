export interface VolumePoint {
  timestamp: number
  volumeUsd: number
  tradesCount?: number
}

export interface SpikeEvent {
  timestamp: number
  volume: number
  spikeRatio: number
  avgVolume: number
  windowSize: number
}

/**
 * Detects spikes in trading volume compared to a rolling average window.
 */
export function detectVolumeSpikes(
  points: VolumePoint[],
  windowSize: number = 10,
  spikeThreshold: number = 2.0
): SpikeEvent[] {
  const events: SpikeEvent[] = []
  if (points.length < windowSize) return events

  const volumes = points.map(p => p.volumeUsd)

  for (let i = windowSize; i < volumes.length; i++) {
    const window = volumes.slice(i - windowSize, i)
    const avg = window.reduce((sum, v) => sum + v, 0) / window.length
    const curr = volumes[i]
    const ratio = avg > 0 ? curr / avg : Infinity

    if (ratio >= spikeThreshold) {
      events.push({
        timestamp: points[i].timestamp,
        volume: curr,
        spikeRatio: Math.round(ratio * 100) / 100,
        avgVolume: Math.round(avg * 100) / 100,
        windowSize,
      })
    }
  }
  return events
}

/**
 * Finds the largest spike by ratio
 */
export function findLargestSpike(events: SpikeEvent[]): SpikeEvent | null {
  if (!events.length) return null
  return events.reduce((max, e) =>
    e.spikeRatio > max.spikeRatio ? e : max
  )
}

/**
 * Summarizes how many spikes occurred and average ratio
 */
export function summarizeSpikes(events: SpikeEvent[]): {
  count: number
  avgRatio: number
} {
  if (!events.length) return { count: 0, avgRatio: 0 }
  const total = events.reduce((sum, e) => sum + e.spikeRatio, 0)
  return { count: events.length, avgRatio: Math.round((total / events.length) * 100) / 100 }
}

/**
 * Merge spike events into original series as annotations
 */
export function annotateSpikes(points: VolumePoint[], spikes: SpikeEvent[]): Array<VolumePoint & { isSpike: boolean }> {
  const spikeSet = new Set(spikes.map(s => s.timestamp))
  return points.map(p => ({
    ...p,
    isSpike: spikeSet.has(p.timestamp),
  }))
}
