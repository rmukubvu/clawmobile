import { AgentProfile } from '../../types/agent';

/**
 * Test fixtures for agent profiles
 */

export const mockAgent1: AgentProfile = {
  id: 'agent-1',
  name: 'ClawMobile Agent',
  url: 'ws://localhost:8080',
  clientId: 'test-client-1',
  token: 'test-token-1',
  connected: true,
  lastConnected: Date.now(),
  lastSeq: 0,
  enableLocation: true,
  enableCalendar: true,
  enableNotifications: true,
  messageCount: 0,
  createdAt: Date.now() - 86400000, // 1 day ago
};

export const mockAgent2: AgentProfile = {
  id: 'agent-2',
  name: 'Secondary Agent',
  url: 'wss://example.com/ws',
  clientId: 'test-client-2',
  connected: false,
  lastSeq: 5,
  enableLocation: false,
  enableCalendar: false,
  enableNotifications: false,
  messageCount: 10,
  createdAt: Date.now() - 172800000, // 2 days ago
};

export const mockDisconnectedAgent: AgentProfile = {
  id: 'agent-3',
  name: 'Disconnected Agent',
  url: 'ws://localhost:9090',
  clientId: 'test-client-3',
  connected: false,
  lastConnected: Date.now() - 3600000, // 1 hour ago
  lastSeq: 100,
  enableLocation: true,
  enableCalendar: true,
  enableNotifications: true,
  messageCount: 50,
  createdAt: Date.now() - 604800000, // 7 days ago
};

export const mockAgents: AgentProfile[] = [
  mockAgent1,
  mockAgent2,
  mockDisconnectedAgent,
];
