import type { TokenDataPoint } from "./token_data_fetcher"

export interface DataIframeConfig {
  containerId: string
  iframeUrl: string
  token: string
  refreshMs?: number
  className?: string
  sandbox?: string
}

export class TokenDataIframeEmbedder {
  private iframe?: HTMLIFrameElement
  private initialized = false

  constructor(private cfg: DataIframeConfig) {}

  async init(): Promise<void> {
    if (this.initialized) return
    const container = document.getElementById(this.cfg.containerId)
    if (!container) throw new Error(`Container not found: ${this.cfg.containerId}`)

    this.iframe = document.createElement("iframe")
    this.iframe.src = this.cfg.iframeUrl
    this.iframe.style.border = "none"
    this.iframe.width = "100%"
    this.iframe.height = "100%"
    if (this.cfg.className) this.iframe.className = this.cfg.className
    if (this.cfg.sandbox) this.iframe.sandbox.add(this.cfg.sandbox)

    this.iframe.onload = () => this.postTokenData().catch(() => {})
    container.appendChild(this.iframe)

    if (this.cfg.refreshMs) {
      setInterval(() => this.postTokenData().catch(() => {}), this.cfg.refreshMs)
    }

    this.initialized = true
  }

  private async postTokenData(): Promise<void> {
    if (!this.iframe?.contentWindow) return
    try {
      const fetcherModule = await import("./token_data_fetcher")
      const fetcher = new fetcherModule.TokenDataFetcher(this.cfg.iframeUrl)
      const data: TokenDataPoint[] = await fetcher.fetchHistory(this.cfg.token)
      this.iframe.contentWindow.postMessage(
        { type: "TOKEN_DATA_UPDATE", token: this.cfg.token, data },
        "*"
      )
    } catch (err) {
      console.error("Failed to post token data", err)
    }
  }

  /** Allow manual refresh */
  async refresh(): Promise<void> {
    await this.postTokenData()
  }

  /** Destroy iframe */
  destroy(): void {
    if (this.iframe?.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe)
    }
    this.iframe = undefined
    this.initialized = false
  }
}
