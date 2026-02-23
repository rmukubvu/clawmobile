import { Message, MessageStatus } from '../../types/message';

/**
 * Test fixtures for messages
 */

export const mockUserMessage: Message = {
  id: 'msg-user-1',
  msg_id: 'uuid-user-1',
  content: 'Hello, agent!',
  timestamp: Date.now(),
  isOwn: true,
  agentId: 'agent-1',
  status: MessageStatus.SENT,
};

export const mockAgentMessage: Message = {
  id: 'msg-agent-1',
  msg_id: 'uuid-agent-1',
  ref_id: 'uuid-user-1',
  seq: 1,
  content: 'Hello! How can I help you?',
  timestamp: Date.now() + 1000,
  isOwn: false,
  agentId: 'agent-1',
  status: MessageStatus.DELIVERED,
};

export const mockPendingMessage: Message = {
  id: 'msg-pending-1',
  msg_id: 'uuid-pending-1',
  content: 'This message is pending',
  timestamp: Date.now(),
  isOwn: true,
  agentId: 'agent-1',
  status: MessageStatus.PENDING,
};

export const mockFailedMessage: Message = {
  id: 'msg-failed-1',
  msg_id: 'uuid-failed-1',
  content: 'This message failed to send',
  timestamp: Date.now(),
  isOwn: true,
  agentId: 'agent-1',
  status: MessageStatus.FAILED,
};

export const mockMessageWithImage: Message = {
  id: 'msg-image-1',
  msg_id: 'uuid-image-1',
  content: 'Check out this image',
  timestamp: Date.now(),
  isOwn: true,
  agentId: 'agent-1',
  status: MessageStatus.SENT,
  imageUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

export const mockMessageWithMetadata: Message = {
  id: 'msg-metadata-1',
  msg_id: 'uuid-metadata-1',
  content: 'Message with metadata',
  timestamp: Date.now(),
  isOwn: true,
  agentId: 'agent-1',
  status: MessageStatus.SENT,
  metadata: {
    location: '37.7749,-122.4194',
    timezone: 'America/Los_Angeles',
    device: 'iPhone 15 Pro',
    app_version: '1.0.0',
    language: 'en-US',
  },
};

export const mockMessages: Message[] = [
  mockUserMessage,
  mockAgentMessage,
  mockPendingMessage,
  mockFailedMessage,
  mockMessageWithImage,
  mockMessageWithMetadata,
];
