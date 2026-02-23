/**
 * Agent profile types for the ClawMobile mobile app
 */

export interface AgentProfile {
  id: string;
  name: string;
  url: string;
  clientId: string;
  token?: string;
  
  // Connection state
  connected: boolean;
  lastConnected?: number;
  lastSeq: number;
  
  // Preferences
  enableLocation: boolean;
  enableCalendar: boolean;
  enableNotifications: boolean;
  
  // Statistics
  messageCount: number;
  createdAt: number;
}
