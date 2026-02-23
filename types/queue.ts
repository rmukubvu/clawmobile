/**
 * Message queue types for the ClawMobile mobile app
 */

import { Message } from './message';

export interface QueuedMessage {
  message: Message;
  retryCount: number;
  nextRetryAt: number;
  createdAt: number;
}

export interface MessageQueue {
  items: QueuedMessage[];
  maxSize: number;
  maxRetries: number;
}
