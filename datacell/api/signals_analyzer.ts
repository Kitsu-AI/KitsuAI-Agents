import type { Signal } from "./signal_api_client"

/**
 * Processes raw signals into actionable events and insights.
 */
export class SignalProcessor {
  /**
   * Filter signals by type and recency.
   */
  filter(signals: Signal[], type: string, sinceTimestamp: number): Signal[] {
    return signals.filter(s => s.type === type && s.timestamp > sinceTimestamp)
  }

  /**
   * Aggregate signals by type, counting occurrences.
   */
  aggregateByType(signals: Signal[]): Record<string, number> {
    return signals.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Summarize a single signal into human-readable string.
   */
  summarize(signal: Signal): string {
    const time = new Date(signal.timestamp).toISOString()
    return `[${time}] ${signal.type.toUpperCase()} → ${JSON.stringify(signal.payload)}`
  }

  /**
   * Generate summaries for all signals.
   */
  summarizeAll(signals: Signal[]): string[] {
    return signals.map(s => this.summarize(s))
  }

  /**
   * Group signals by type.
   */
  groupByType(signals: Signal[]): Record<string, Signal[]> {
    return signals.reduce((acc, s) => {
      if (!acc[s.type]) acc[s.type] = []
      acc[s.type].push(s)
      return acc
    }, {} as Record<string, Signal[]>)
  }

  /**
   * Find the most recent signal of a given type.
   */
  latestOfType(signals: Signal[], type: string): Signal | undefined {
    return signals
      .filter(s => s.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
  }

  /**
   * Detect anomalies by threshold on payload field values.
   */
  detectAnomalies(
    signals: Signal[],
    key: string,
    threshold: number
  ): Signal[] {
    return signals.filter(s => {
      const val = s.payload?.[key]
      return typeof val === "number" && val > threshold
    })
  }

  /**
   * Compute time range for the signal batch.
   */
  timeRange(signals: Signal[]): { from: number; to: number } | null {
    if (signals.length === 0) return null
    const timestamps = signals.map(s => s.timestamp)
    return { from: Math.min(...timestamps), to: Math.max(...timestamps) }
  }
}
