import * as fc from 'fast-check';
import { Message, MessageStatus, MessageMetadata } from '../../types/message';
import { AgentProfile } from '../../types/agent';
import { ConnectionQuality, ConnectionStatus } from '../../types/connection';
import { QueuedMessage } from '../../types/queue';

/**
 * fast-check arbitraries for property-based testing
 */

// Message Status arbitrary
export const messageStatusArbitrary = (): fc.Arbitrary<MessageStatus> =>
  fc.constantFrom(
    MessageStatus.PENDING,
    MessageStatus.SENDING,
    MessageStatus.SENT,
    MessageStatus.DELIVERED,
    MessageStatus.READ,
    MessageStatus.FAILED
  );

// Message Metadata arbitrary
export const messageMetadataArbitrary = (): fc.Arbitrary<MessageMetadata> =>
  fc.record({
    location: fc.option(fc.string(), { nil: undefined }),
    calendar: fc.option(fc.string(), { nil: undefined }),
    timezone: fc.option(fc.string(), { nil: undefined }),
    device: fc.option(fc.string(), { nil: undefined }),
    app_version: fc.option(fc.string(), { nil: undefined }),
    language: fc.option(fc.string(), { nil: undefined }),
    model: fc.option(fc.string(), { nil: undefined }),
    tokens: fc.option(fc.nat(), { nil: undefined }),
    tool_calls: fc.option(fc.array(fc.string()), { nil: undefined }),
  });

// Message arbitrary
export const messageArbitrary = (): fc.Arbitrary<Message> =>
  fc.record({
    id: fc.uuid(),
    msg_id: fc.uuid(),
    ref_id: fc.option(fc.uuid(), { nil: undefined }),
    seq: fc.option(fc.nat(), { nil: undefined }),
    content: fc.string({ minLength: 1, maxLength: 1000 }),
    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    isOwn: fc.boolean(),
    agentId: fc.uuid(),
    status: messageStatusArbitrary(),
    imageUri: fc.option(fc.webUrl(), { nil: undefined }),
    audioUri: fc.option(fc.string(), { nil: undefined }),
    metadata: fc.option(messageMetadataArbitrary(), { nil: undefined }),
  });

// Agent Profile arbitrary
export const agentProfileArbitrary = (): fc.Arbitrary<AgentProfile> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    url: fc.webUrl({ validSchemes: ['ws', 'wss'] }),
    clientId: fc.uuid(),
    token: fc.option(fc.string(), { nil: undefined }),
    connected: fc.boolean(),
    lastConnected: fc.option(fc.integer({ min: 1000000000000, max: 9999999999999 }), { nil: undefined }),
    lastSeq: fc.nat(),
    enableLocation: fc.boolean(),
    enableCalendar: fc.boolean(),
    enableNotifications: fc.boolean(),
    messageCount: fc.nat(),
    createdAt: fc.integer({ min: 1000000000000, max: 9999999999999 }),
  });

// Connection Status arbitrary
export const connectionStatusArbitrary = (): fc.Arbitrary<ConnectionStatus> =>
  fc.constantFrom(
    ConnectionStatus.EXCELLENT,
    ConnectionStatus.GOOD,
    ConnectionStatus.POOR,
    ConnectionStatus.OFFLINE
  );

// Connection Quality arbitrary
export const connectionQualityArbitrary = (): fc.Arbitrary<ConnectionQuality> =>
  fc.record({
    status: connectionStatusArbitrary(),
    latency: fc.nat({ max: 5000 }),
    lastPing: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    lastPong: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    consecutiveFailures: fc.nat({ max: 10 }),
    uptime: fc.nat(),
    reconnectAttempts: fc.nat({ max: 20 }),
  });

// Queued Message arbitrary
export const queuedMessageArbitrary = (): fc.Arbitrary<QueuedMessage> =>
  fc.record({
    message: messageArbitrary(),
    retryCount: fc.nat({ max: 5 }),
    nextRetryAt: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    createdAt: fc.integer({ min: 1000000000000, max: 9999999999999 }),
  });

// Array of messages arbitrary
export const messagesArrayArbitrary = (minLength = 0, maxLength = 100): fc.Arbitrary<Message[]> =>
  fc.array(messageArbitrary(), { minLength, maxLength });

// Array of agents arbitrary
export const agentsArrayArbitrary = (minLength = 1, maxLength = 10): fc.Arbitrary<AgentProfile[]> =>
  fc.array(agentProfileArbitrary(), { minLength, maxLength });

// Array of queued messages arbitrary
export const queuedMessagesArrayArbitrary = (minLength = 0, maxLength = 100): fc.Arbitrary<QueuedMessage[]> =>
  fc.array(queuedMessageArbitrary(), { minLength, maxLength });

// Latency arbitrary (in milliseconds)
export const latencyArbitrary = (): fc.Arbitrary<number> =>
  fc.nat({ max: 5000 });

// Search query arbitrary
export const searchQueryArbitrary = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 100 });

// Theme mode arbitrary
export const themeModeArbitrary = (): fc.Arbitrary<'light' | 'dark' | 'system'> =>
  fc.constantFrom('light', 'dark', 'system');

// Base64 image arbitrary (small valid base64 string)
export const base64ImageArbitrary = (): fc.Arbitrary<string> =>
  fc.base64String({ minLength: 100, maxLength: 1000 }).map(
    (base64) => `data:image/png;base64,${base64}`
  );

// GPS coordinates arbitrary
export const gpsCoordinatesArbitrary = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.double({ min: -90, max: 90, noNaN: true }),
    fc.double({ min: -180, max: 180, noNaN: true })
  ).map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`);

// Timestamp arbitrary (Unix epoch in milliseconds)
export const timestampArbitrary = (): fc.Arbitrary<number> =>
  fc.integer({ min: 1000000000000, max: 9999999999999 });

// Sequence number arbitrary
export const sequenceNumberArbitrary = (): fc.Arbitrary<number> =>
  fc.nat({ max: 1000000 });

// Retry delay arbitrary (exponential backoff: 1s, 2s, 4s)
export const retryDelayArbitrary = (): fc.Arbitrary<number> =>
  fc.constantFrom(1000, 2000, 4000);

// Reconnection delay arbitrary (exponential backoff with max 30s)
export const reconnectionDelayArbitrary = (): fc.Arbitrary<number> =>
  fc.constantFrom(1000, 2000, 4000, 8000, 16000, 30000);
