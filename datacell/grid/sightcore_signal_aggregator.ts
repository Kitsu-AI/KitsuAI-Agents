import type { SightCoreMessage } from "./WebSocketClient"

/**
 * Aggregated stats for a topic
 */
export interface AggregatedSignal<P = unknown> {
  topic: string
  count: number
  lastPayload: P | null
  lastTimestamp: number
}

/**
 * Options for SignalAggregator behavior
 */
export interface SignalAggregatorOptions {
  /**
   * If provided, entries older than (now - ttlMs) will be pruned when processing or on demand
   */
  ttlMs?: number
}

/**
 * Collects and aggregates messages by topic with lightweight stats
 */
export class SignalAggregator<P = unknown> {
  private counts: Record<string, AggregatedSignal<P>> = {}
  private readonly ttlMs?: number

  constructor(options: SignalAggregatorOptions = {}) {
    this.ttlMs = options.ttlMs
  }

  /**
   * Process a message and return the updated aggregate for its topic
   */
  processMessage(msg: SightCoreMessage & { topic: string; payload: P; timestamp: number }): AggregatedSignal<P> {
    const { topic, payload, timestamp } = msg
    const entry = this.counts[topic] ?? { topic, count: 0, lastPayload: null, lastTimestamp: 0 }
    entry.count += 1
    entry.lastPayload = payload
    entry.lastTimestamp = timestamp
    this.counts[topic] = entry

    if (this.ttlMs) this.pruneStale(Date.now())
    return entry
  }

  getAggregated(topic: string): AggregatedSignal<P> | undefined {
    return this.counts[topic]
  }

  getAllAggregated(): AggregatedSignal<P>[] {
    return Object.values(this.counts)
  }

  /** Number of tracked topics */
  size(): number {
    return Object.keys(this.counts).length
  }

  /** List of tracked topics */
  topics(): string[] {
    return Object.keys(this.counts)
  }

  /** Check if a topic is tracked */
  hasTopic(topic: string): boolean {
    return topic in this.counts
  }

  /** Get only the count for a topic (0 if missing) */
  getCount(topic: string): number {
    return this.counts[topic]?.count ?? 0
  }

  /** Remove a single topic */
  removeTopic(topic: string): void {
    delete this.counts[topic]
  }

  /** Reset all aggregates */
  reset(): void {
    this.counts = {}
  }

  /** Deep clone snapshot for safe external usage */
  snapshot(): Record<string, AggregatedSignal<P>> {
    const out: Record<string, AggregatedSignal<P>> = {}
    for (const [k, v] of Object.entries(this.counts)) {
      out[k] = { ...v }
    }
    return out
  }

  /** Serialize to JSON-friendly structure */
  toJSON(): AggregatedSignal<P>[] {
    return this.getAllAggregated()
  }

  /** Restore from serialized aggregates */
  static fromJSON<Q = unknown>(rows: AggregatedSignal<Q>[], options: SignalAggregatorOptions = {}): SignalAggregator<Q> {
    const agg = new SignalAggregator<Q>(options)
    for (const row of rows) {
      agg.counts[row.topic] = { ...row }
    }
    return agg
  }

  /**
   * Remove entries older than ttlMs relative to provided "now"
   * Does nothing if ttlMs is not set
   */
  pruneStale(now: number = Date.now()): void {
    if (!this.ttlMs) return
    const cutoff = now - this.ttlMs
    for (const [topic, entry] of Object.entries(this.counts)) {
      if (entry.lastTimestamp < cutoff) delete this.counts[topic]
    }
  }
}
