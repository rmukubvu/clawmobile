/**
 * Message types for the ClawMobile mobile app
 */

export enum MessageStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface MessageMetadata {
  location?: string;
  calendar?: string;
  timezone?: string;
  device?: string;
  app_version?: string;
  language?: string;
  model?: string;
  tokens?: number;
  tool_calls?: string[];
}

export interface Message {
  // Core fields
  id: string;
  msg_id: string;
  ref_id?: string;
  seq?: number;
  content: string;
  timestamp: number;
  
  // Ownership
  isOwn: boolean;
  agentId: string;
  
  // Status tracking
  status: MessageStatus;
  
  // Rich content
  imageUri?: string;
  audioUri?: string;
  
  // Metadata
  metadata?: MessageMetadata;
}
