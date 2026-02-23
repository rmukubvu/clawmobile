/**
 * Connection quality types for the ClawMobile mobile app
 */

export enum ConnectionStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  POOR = 'poor',
  OFFLINE = 'offline',
}

export interface ConnectionQuality {
  status: ConnectionStatus;
  latency: number;
  lastPing: number;
  lastPong: number;
  consecutiveFailures: number;
  uptime: number;
  reconnectAttempts: number;
}
