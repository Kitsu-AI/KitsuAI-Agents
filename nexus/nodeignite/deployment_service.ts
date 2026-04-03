export interface LaunchConfig {
  contractName: string
  parameters: Record<string, any>
  deployEndpoint: string
  apiKey?: string
  timeoutMs?: number
}

export interface LaunchResult {
  success: boolean
  address?: string
  transactionHash?: string
  network?: string
  error?: string
  deployedAt?: string
}

export class LaunchNode {
  constructor(private config: LaunchConfig) {}

  private async fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(input, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  async deploy(): Promise<LaunchResult> {
    const { deployEndpoint, apiKey, contractName, parameters, timeoutMs = 15_000 } = this.config
    try {
      const res = await this.fetchWithTimeout(
        deployEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ contractName, parameters }),
        },
        timeoutMs
      )

      if (!res.ok) {
        const text = await res.text()
        return {
          success: false,
          error: `HTTP ${res.status}: ${text}`
        }
      }

      const json = await res.json()
      return {
        success: true,
        address: json.contractAddress,
        transactionHash: json.txHash,
        network: json.network ?? undefined,
        deployedAt: new Date().toISOString(),
      }
    } catch (err: any) {
      return { success: false, error: err.message ?? String(err) }
    }
  }
}
