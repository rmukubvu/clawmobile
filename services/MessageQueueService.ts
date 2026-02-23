import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/types/message';

const QUEUE_KEY = 'queue:outbound';

// Wrapper for queued items to track retry metadata
export interface QueuedMessage {
    message: Message;
    retryCount: number;
    nextRetryAt: number;
    createdAt: number;
}

export const MessageQueueService = {
    /**
     * Load the queue from storage
     */
    async getQueue(): Promise<QueuedMessage[]> {
        try {
            const raw = await AsyncStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error('Failed to load queue:', error);
            return [];
        }
    },

    /**
     * Save the queue to storage
     */
    async saveQueue(queue: QueuedMessage[]): Promise<void> {
        try {
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('Failed to save queue:', error);
        }
    },

    /**
     * Add a message to the queue
     */
    async enqueue(message: Message): Promise<void> {
        const queue = await this.getQueue();
        const item: QueuedMessage = {
            message,
            retryCount: 0,
            nextRetryAt: Date.now(),
            createdAt: Date.now(),
        };
        queue.push(item);
        await this.saveQueue(queue);
    },

    /**
     * Remove a specific message from the queue by ID
     */
    async remove(id: string): Promise<void> {
        const queue = await this.getQueue();
        const newQueue = queue.filter(item => item.message.id !== id);
        await this.saveQueue(newQueue);
    },

    /**
     * Peek at items that are ready to be sent (retry time passed)
     */
    async peekReady(): Promise<QueuedMessage[]> {
        const queue = await this.getQueue();
        const now = Date.now();
        return queue.filter(item => item.nextRetryAt <= now);
    },

    /**
     * Update a queue item (e.g. after a failed retry)
     */
    async update(id: string, updates: Partial<QueuedMessage>): Promise<void> {
        const queue = await this.getQueue();
        const index = queue.findIndex(item => item.message.id === id);
        if (index !== -1) {
            queue[index] = { ...queue[index], ...updates };
            await this.saveQueue(queue);
        }
    },

    /**
     * Clear the entire queue
     */
    async clear(): Promise<void> {
        await AsyncStorage.removeItem(QUEUE_KEY);
    }
};
