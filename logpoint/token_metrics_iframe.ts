import type { TokenMetrics } from "./token_analysis_calculator"

export interface IframeConfig {
  containerId: string
  srcUrl: string
  metrics: TokenMetrics
  refreshIntervalMs?: number
  additionalData?: Record<string, any>
}

export class TokenAnalysisIframe {
  private iframeEl: HTMLIFrameElement | null = null
  private intervalId?: number

  constructor(private config: IframeConfig) {}

  init(): void {
    const container = document.getElementById(this.config.containerId)
    if (!container) throw new Error("Container not found: " + this.config.containerId)

    const iframe = document.createElement("iframe")
    iframe.src = this.config.srcUrl
    iframe.width = "100%"
    iframe.height = "100%"
    iframe.style.border = "0"
    iframe.onload = () => this.postMetrics()
    container.appendChild(iframe)
    this.iframeEl = iframe

    if (this.config.refreshIntervalMs) {
      this.intervalId = window.setInterval(() => this.postMetrics(), this.config.refreshIntervalMs)
    }
  }

  private postMetrics(): void {
    if (!this.iframeEl?.contentWindow) return
    const messagePayload = {
      type: "TOKEN_ANALYSIS_METRICS",
      payload: this.config.metrics,
      timestamp: Date.now(),
      additional: this.config.additionalData ?? {},
    }
    this.iframeEl.contentWindow.postMessage(messagePayload, "*")
    console.log("Posted metrics to iframe:", messagePayload)
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    if (this.iframeEl?.parentElement) {
      this.iframeEl.parentElement.removeChild(this.iframeEl)
    }
    this.iframeEl = null
  }
}
