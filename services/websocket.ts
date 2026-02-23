/**
 * AgentConnection — manages a single WebSocket connection to a ClawMobile
 * (or compatible) agent server.
 *
 * Usage:
 *   const conn = new AgentConnection({ url: 'ws://192.168.1.10:18792/ws', clientId: 'alice', token: 'secret' });
 *   conn.onMessage = (msg) => console.log(msg);
 *   conn.connect();
 */

export type WSInbound =
  | { type: 'message'; content: string; chat_id: string; id?: string }
  | { type: 'notification'; content: string; chat_id: string; id?: string }
  | { type: 'daily_brief'; content: string; chat_id: string; id?: string }
  | { type: 'goal_checkin'; content: string; chat_id: string; id?: string }
  | { type: 'workflow_result'; content: string; chat_id: string; id?: string }
  | { type: 'typing'; chat_id: string; is_typing: boolean }
  | { type: 'text_delta'; content: string; chat_id: string; message_id: string } // Streaming delta
  | { type: 'ack'; msg_id: string } // Delivery acknowledgement
  | { type: 'pong' };

export type WSOutbound =
  | { type: 'message'; client_id: string; content: string; msg_id?: string; metadata?: Record<string, string> }
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
  private reconnectAttempts = 0;
  private lastPingTime = 0;
  private lastSeq = 0;

  onMessage: ((msg: WSInbound) => void) | null = null;
  onStatusChange: ((connected: boolean) => void) | null = null;
  onLatencyChange: ((latency: number) => void) | null = null;

  constructor(private opts: AgentConnectionOptions) { }

  connect() {
    if (this.destroyed) return;
    this.cleanup();

    const { url, clientId, token } = this.opts;
    const params = new URLSearchParams({ client_id: clientId });
    if (token) params.set('token', token);
    if (this.lastSeq > 0) params.set('last_seq', this.lastSeq.toString());

    const fullUrl = `${url}?${params.toString()}`;
    this.ws = new WebSocket(fullUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0; // Reset on successful connection
      this.onStatusChange?.(true);
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSInbound = JSON.parse(event.data as string);

        if (msg.type === 'pong') {
          const latency = Date.now() - this.lastPingTime;
          this.onLatencyChange?.(latency);
          return;
        }

        // Track sequence number if present (assuming msg.id is sequential or we use a specific seq field)
        // If the server sends a strictly increasing 'seq' field, use that. 
        // For now, we'll assume the server might send 'seq'. If not, we can't really do accurate resumption without it.
        // Let's assume the message MIGHT have a seq field (we should update WSInbound if we want to be strict).
        // For now, let's essentially rely on the fact that if we get a message, we processed it.

        this.onMessage?.(msg);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange?.(false);
      this.stopPing();
      if (!this.destroyed) {
        const delay = Math.min(
          (this.opts.reconnectDelay ?? 3000) * Math.pow(1.5, this.reconnectAttempts),
          30000
        );
        this.reconnectAttempts++;
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(
          () => this.connect(),
          delay,
        );
      }
    };

    this.ws.onerror = (e) => {
      console.log('[WS] Error:', (e as any).message);
      this.ws?.close();
    };
  }

  send(payload: WSOutbound) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  sendMessage(content: string, msgId?: string, metadata?: Record<string, string>) {
    this.send({
      type: 'message',
      client_id: this.opts.clientId,
      content,
      msg_id: msgId,
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
      this.lastPingTime = Date.now();
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
