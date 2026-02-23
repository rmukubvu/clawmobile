import { create } from 'zustand';
import { Message, MessageStatus } from '@/types/message';
import { MessageStorageService } from '@/services/MessageStorageService';

interface ChatState {
  messages: Message[];
  // Legacy single-agent status (kept for backward compat with Settings screen)
  connected: boolean;
  connecting: boolean;
  latency: number | null;
  // Per-agent status (multi-agent support)
  agentConnected: Record<string, boolean>;
  agentLatency: Record<string, number>;

  // Actions
  hydrateMessages: (agentId: string) => Promise<void>;
  addMessage: (agentId: string, msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setConnected: (val: boolean) => void;
  setConnecting: (val: boolean) => void;
  setAgentConnected: (agentId: string, val: boolean) => void;
  setAgentLatency: (agentId: string, ms: number) => void;
  clearMessages: () => void;
  typingAgents: Record<string, boolean>;
  setTyping: (agentId: string, isTyping: boolean) => void;
  clearTyping: () => void;
  appendMessageContent: (agentId: string, messageId: string, content: string) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  setLatency: (ms: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  connected: false,
  connecting: false,
  latency: null,
  agentConnected: {},
  agentLatency: {},
  typingAgents: {},

  hydrateMessages: async (agentId: string) => {
    const messages = await MessageStorageService.getMessages(agentId);
    set({ messages });
  },

  addMessage: (agentId, msg) => {
    set((state) => {
      if (state.messages.some(m => m.id === msg.id)) return state;
      return { messages: [...state.messages, msg] };
    });
    MessageStorageService.saveMessage(agentId, msg);
  },

  setMessages: (msgs) => set({ messages: msgs }),

  setConnected: (val) => set({ connected: val, connecting: false }),
  setConnecting: (val) => set({ connecting: val }),
  setLatency: (ms) => set({ latency: ms }),

  setAgentConnected: (agentId, val) => set((state) => ({
    agentConnected: { ...state.agentConnected, [agentId]: val },
    // Keep legacy "connected" in sync if any agent is connected
    connected: val || Object.entries({ ...state.agentConnected, [agentId]: val })
      .some(([, v]) => v),
    connecting: false,
  })),

  setAgentLatency: (agentId, ms) => set((state) => ({
    agentLatency: { ...state.agentLatency, [agentId]: ms },
  })),

  clearMessages: () => set({ messages: [] }),

  setTyping: (agentId, isTyping) => set((state) => ({
    typingAgents: { ...state.typingAgents, [agentId]: isTyping }
  })),
  clearTyping: () => set({ typingAgents: {} }),

  appendMessageContent: (agentId, messageId, content) => set((state) => {
    const msgs = state.messages.map(m => {
      if (m.id === messageId) return { ...m, content: m.content + content };
      return m;
    });
    const updated = msgs.find(m => m.id === messageId);
    if (updated) MessageStorageService.saveMessage(agentId, updated);
    return { messages: msgs };
  }),

  updateMessageStatus: (messageId, status) => set((state) => {
    const msgs = state.messages.map(m => m.id === messageId ? { ...m, status } : m);
    const updated = msgs.find(m => m.id === messageId);
    if (updated) MessageStorageService.saveMessage(updated.agentId, updated);
    return { messages: msgs };
  }),
}));
