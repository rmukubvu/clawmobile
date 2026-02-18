import { create } from 'zustand';

export type MessageRole = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  agentId?: string; // which agent sent this
}

interface ChatState {
  messages: ChatMessage[];
  connected: boolean;
  connecting: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setConnected: (val: boolean) => void;
  setConnecting: (val: boolean) => void;
  clearMessages: () => void;
}

let _idCounter = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  connected: false,
  connecting: false,

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: String(++_idCounter), timestamp: Date.now() },
      ],
    })),

  setConnected: (val) => set({ connected: val, connecting: false }),
  setConnecting: (val) => set({ connecting: val }),
  clearMessages: () => set({ messages: [] }),
}));
