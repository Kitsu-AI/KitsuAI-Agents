export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  status?: number
  fetchedAt?: number
}

/**
 * Simple HTTP client for fetching signals.
 */
export class SignalApiClient {
  constructor(private baseUrl: string, private apiKey?: string, private timeoutMs = 10_000) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`
    return headers
  }

  private async doFetch<T>(url: string): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(url, { method: "GET", headers: this.getHeaders(), signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}`, status: res.status, fetchedAt: Date.now() }
      }
      const data = (await res.json()) as T
      return { success: true, data, status: res.status, fetchedAt: Date.now() }
    } catch (err: any) {
      clearTimeout(timer)
      return { success: false, error: err.message, fetchedAt: Date.now() }
    }
  }

  async fetchAllSignals(): Promise<ApiResponse<Signal[]>> {
    return this.doFetch<Signal[]>(`${this.baseUrl}/signals`)
  }

  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    return this.doFetch<Signal>(`${this.baseUrl}/signals/${encodeURIComponent(id)}`)
  }

  /** Search signals by type */
  async fetchSignalsByType(type: string): Promise<ApiResponse<Signal[]>> {
    return this.doFetch<Signal[]>(`${this.baseUrl}/signals?type=${encodeURIComponent(type)}`)
  }

  /** Stream signals using Server-Sent Events */
  streamSignals(onMessage: (s: Signal) => void, onError?: (e: any) => void): EventSource {
    const url = `${this.baseUrl}/signals/stream`
    const es = new EventSource(url, { withCredentials: false })
    es.onmessage = ev => {
      try {
        const signal: Signal = JSON.parse(ev.data)
        onMessage(signal)
      } catch (err) {
        if (onError) onError(err)
      }
    }
    es.onerror = err => {
      if (onError) onError(err)
    }
    return es
  }
}
