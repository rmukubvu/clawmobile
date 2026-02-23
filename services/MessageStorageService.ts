import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/types/message';

const STORAGE_PREFIX = 'messages:';

export const MessageStorageService = {
  /**
   * Get the storage key for a specific agent
   */
  getKey(agentId: string) {
    return `${STORAGE_PREFIX}${agentId}`;
  },

  /**
   * Save a single message to storage
   * This is inefficient for large histories but acceptable for MVP
   * For better performance, we'd use a real DB like WatermelonDB or SQLite
   */
  async saveMessage(agentId: string, message: Message): Promise<void> {
    try {
      const key = this.getKey(agentId);
      const existing = await AsyncStorage.getItem(key);
      const messages: Message[] = existing ? JSON.parse(existing) : [];

      // Check if message already exists (deduplication)
      if (messages.some(m => m.id === message.id)) {
        return;
      }

      messages.push(message);

      // Basic limit to prevent storage explosion (keep last 500)
      if (messages.length > 500) {
        messages.splice(0, messages.length - 500);
      }

      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  },

  /**
   * Save multiple messages to storage (bulk)
   */
  async saveMessages(agentId: string, newMessages: Message[]): Promise<void> {
    try {
      const key = this.getKey(agentId);
      const existing = await AsyncStorage.getItem(key);
      let messages: Message[] = existing ? JSON.parse(existing) : [];

      // Merge and deduplicate
      const existingIds = new Set(messages.map(m => m.id));
      const toAdd = newMessages.filter(m => !existingIds.has(m.id));

      if (toAdd.length === 0) return;

      messages = [...messages, ...toAdd];

      // Sort by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);

      // Limit size
      if (messages.length > 500) {
        messages = messages.slice(messages.length - 500);
      }

      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  },

  /**
   * Retrieve messages for an agent
   */
  async getMessages(agentId: string): Promise<Message[]> {
    try {
      const key = this.getKey(agentId);
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  },

  /**
   * Clear all messages for an agent
   */
  async clearMessages(agentId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(agentId));
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  },

  /**
   * Get the last message for an agent (for preview)
   */
  async getLastMessage(agentId: string): Promise<Message | undefined> {
    try {
      const messages = await this.getMessages(agentId);
      return messages.length > 0 ? messages[messages.length - 1] : undefined;
    } catch (error) {
      console.error('Failed to get last message:', error);
      return undefined;
    }
  }
};
