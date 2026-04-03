export interface SightCoreConfig {
  url: string
  protocols?: string[]
  reconnectIntervalMs?: number
  autoReconnect?: boolean
  maxReconnectAttempts?: number
}

export type SightCoreMessage<P = unknown> = {
  topic: string
  payload: P
  timestamp: number
}

/**
 * WebSocket client wrapper with auto-reconnect and JSON message support
 */
export class SightCoreWebSocket<P = unknown> {
  private socket?: WebSocket
  private readonly url: string
  private readonly protocols?: string[]
  private readonly reconnectInterval: number
  private readonly autoReconnect: boolean
  private readonly maxReconnectAttempts: number
  private reconnectAttempts = 0
  private isManuallyClosed = false

  constructor(config: SightCoreConfig) {
    this.url = config.url
    this.protocols = config.protocols
    this.reconnectInterval = config.reconnectIntervalMs ?? 5000
    this.autoReconnect = config.autoReconnect ?? true
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? Infinity
  }

  connect(
    onMessage: (msg: SightCoreMessage<P>) => void,
    onOpen?: () => void,
    onClose?: () => void,
    onError?: (err: Event) => void
  ): void {
    this.isManuallyClosed = false
    this.socket = this.protocols
      ? new WebSocket(this.url, this.protocols)
      : new WebSocket(this.url)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      onOpen?.()
    }

    this.socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data) as SightCoreMessage<P>
        if (msg.topic && msg.timestamp) onMessage(msg)
      } catch (err) {
        // ignore invalid messages silently
      }
    }

    this.socket.onclose = () => {
      onClose?.()
      if (this.autoReconnect && !this.isManuallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(onMessage, onOpen, onClose, onError), this.reconnectInterval)
      }
    }

    this.socket.onerror = ev => {
      onError?.(ev)
      this.socket?.close()
    }
  }

  /** Send a message with topic and payload */
  send(topic: string, payload: P): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const msg: SightCoreMessage<P> = { topic, payload, timestamp: Date.now() }
      this.socket.send(JSON.stringify(msg))
    }
  }

  /** Whether socket is open */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  /** Disconnect gracefully and disable auto-reconnect */
  disconnect(): void {
    this.isManuallyClosed = true
    this.socket?.close()
  }

  /** Force reconnect */
  reconnect(): void {
    if (this.socket) {
      this.isManuallyClosed = false
      this.socket.close()
    }
  }
}
