/**
 * AgentConnection — manages a single WebSocket connection to a PicoClaw
 * (or compatible) agent server.
 *
 * Usage:
 *   const conn = new AgentConnection({ url: 'ws://192.168.1.10:18792/ws', clientId: 'alice', token: 'secret' });
 *   conn.onMessage = (msg) => console.log(msg);
 *   conn.connect();
 */

export type WSInbound =
  | { type: 'message'; content: string; chat_id: string }
  | { type: 'notification'; content: string; chat_id: string }
  | { type: 'pong' };

export type WSOutbound =
  | { type: 'message'; client_id: string; content: string; metadata?: Record<string, string> }
  | { type: 'ping' };

export interface AgentConnectionOptions {
  url: string;       // e.g. ws://192.168.1.10:18792/ws
  clientId: string;
  token?: string;
  reconnectDelay?: number; // ms, default 3000
  pingInterval?: number;   // ms, default 30000
}

export class AgentConnection {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  onMessage: ((msg: WSInbound) => void) | null = null;
  onStatusChange: ((connected: boolean) => void) | null = null;

  constructor(private opts: AgentConnectionOptions) {}

  connect() {
    if (this.destroyed) return;
    this.cleanup();

    const { url, clientId, token } = this.opts;
    const params = new URLSearchParams({ client_id: clientId });
    if (token) params.set('token', token);

    const fullUrl = `${url}?${params.toString()}`;
    this.ws = new WebSocket(fullUrl);

    this.ws.onopen = () => {
      this.onStatusChange?.(true);
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSInbound = JSON.parse(event.data as string);
        this.onMessage?.(msg);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange?.(false);
      this.stopPing();
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(
          () => this.connect(),
          this.opts.reconnectDelay ?? 3000,
        );
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  send(payload: WSOutbound) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  sendMessage(content: string, metadata?: Record<string, string>) {
    this.send({
      type: 'message',
      client_id: this.opts.clientId,
      content,
      metadata,
    });
  }

  disconnect() {
    this.destroyed = true;
    this.cleanup();
  }

  private cleanup() {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // prevent re-connect loop
      this.ws.close();
      this.ws = null;
    }
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.opts.pingInterval ?? 30_000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
