import { mockUserMessage, mockAgentMessage, mockMessages } from '../fixtures/messages';
import { mockAgent1, mockAgents } from '../fixtures/agents';
import { MessageStatus } from '../../types/message';

/**
 * Unit tests to verify test fixtures are properly configured
 */

describe('Test Fixtures', () => {
  describe('Message Fixtures', () => {
    it('should have valid user message', () => {
      expect(mockUserMessage.id).toBeDefined();
      expect(mockUserMessage.isOwn).toBe(true);
      expect(mockUserMessage.content).toBeTruthy();
      expect(mockUserMessage.status).toBe(MessageStatus.SENT);
    });

    it('should have valid agent message', () => {
      expect(mockAgentMessage.id).toBeDefined();
      expect(mockAgentMessage.isOwn).toBe(false);
      expect(mockAgentMessage.content).toBeTruthy();
      expect(mockAgentMessage.ref_id).toBeDefined();
    });

    it('should have array of messages', () => {
      expect(Array.isArray(mockMessages)).toBe(true);
      expect(mockMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Fixtures', () => {
    it('should have valid agent profile', () => {
      expect(mockAgent1.id).toBeDefined();
      expect(mockAgent1.name).toBeTruthy();
      expect(mockAgent1.url).toMatch(/^wss?:\/\//);
      expect(mockAgent1.clientId).toBeDefined();
    });

    it('should have array of agents', () => {
      expect(Array.isArray(mockAgents)).toBe(true);
      expect(mockAgents.length).toBeGreaterThan(0);
    });
  });
});
