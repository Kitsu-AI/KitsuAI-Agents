/**
 * Analyze on-chain token activity: fetch recent activity and summarize transfers.
 * Uses Solana JSON-RPC (real API) with jsonParsed transactions.
 */

export interface ActivityRecord {
  timestamp: number
  signature: string
  source: string
  destination: string
  amount: number            // ui amount in token units
  mint: string
  slot: number
}

export interface AnalyzerOptions {
  timeoutMs?: number
  commitment?: "processed" | "confirmed" | "finalized"
}

type JsonRpcResponse<T> = { jsonrpc: "2.0"; id: number | string; result?: T; error?: { code: number; message: string } }

export class TokenActivityAnalyzer {
  private readonly timeoutMs: number
  private readonly commitment: AnalyzerOptions["commitment"]

  constructor(private rpcEndpoint: string, opts: AnalyzerOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 12_000
    this.commitment = opts.commitment ?? "confirmed"
  }

  private async rpc<T>(method: string, params: any[]): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(this.rpcEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: controller.signal
      })
      if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`)
      const json = (await res.json()) as JsonRpcResponse<T>
      if (json.error) throw new Error(`RPC ${method} error ${json.error.code}: ${json.error.message}`)
      return json.result as T
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Fetch recent signatures referencing the provided address (often a token account or mint authority).
   * For token-level analysis you might prefer an associated token account rather than the mint address.
   */
  async fetchRecentSignatures(address: string, limit = 100): Promise<string[]> {
    type SigInfo = { signature: string }
    const result = await this.rpc<SigInfo[]>("getSignaturesForAddress", [
      address,
      { limit, commitment: this.commitment }
    ])
    return result.map(e => e.signature)
  }

  /**
   * Convert a transaction into token transfer ActivityRecords for the given mint (ui amounts).
   * Expects "jsonParsed" encoding to read token balances safely.
   */
  private extractTokenTransfersForMint(
    tx: any,
    signature: string,
    mint: string
  ): ActivityRecord[] {
    const meta = tx?.meta
    const blockTimeSec: number | null = tx?.blockTime ?? null
    const slot: number = tx?.slot ?? 0
    if (!meta) return []

    const pre = (meta.preTokenBalances ?? []) as any[]
    const post = (meta.postTokenBalances ?? []) as any[]

    const out: ActivityRecord[] = []
    // index by accountIndex; iterate post balances and compare to pre
    for (let i = 0; i < post.length; i++) {
      const p = post[i]
      if (!p?.mint || p.mint !== mint) continue
      const q = pre.find((b: any) => b.accountIndex === p.accountIndex) ?? {
        uiTokenAmount: { uiAmount: 0 },
        owner: null,
        mint
      }
      const pAmt = Number(p.uiTokenAmount?.uiAmount ?? 0)
      const qAmt = Number(q.uiTokenAmount?.uiAmount ?? 0)
      const delta = pAmt - qAmt
      if (delta === 0) continue

      out.push({
        timestamp: (blockTimeSec ? blockTimeSec * 1000 : Date.now()),
        signature,
        source: delta > 0 ? (q.owner ?? "unknown") : (p.owner ?? "unknown"),
        destination: delta > 0 ? (p.owner ?? "unknown") : (q.owner ?? "unknown"),
        amount: Math.abs(delta),
        mint,
        slot
      })
    }
    return out
  }

  /**
   * Analyze activity for a given mint/address.
   * Note: Solana JSON-RPC getTransaction must be called with "jsonParsed" encoding for token balances.
   */
  async analyzeActivity(mintOrAddress: string, limit = 50): Promise<ActivityRecord[]> {
    const sigs = await this.fetchRecentSignatures(mintOrAddress, limit)
    const records: ActivityRecord[] = []

    // fetch transactions sequentially to avoid RPC flood; adjust if you need concurrency
    for (const sig of sigs) {
      try {
        const tx = await this.rpc<any>("getTransaction", [
          sig,
          {
            commitment: this.commitment,
            maxSupportedTransactionVersion: 0,
            encoding: "jsonParsed"
          }
        ])
        if (!tx) continue
        records.push(...this.extractTokenTransfersForMint(tx, sig, mintOrAddress))
      } catch {
        // skip failed tx
      }
    }
    return records
  }
}
