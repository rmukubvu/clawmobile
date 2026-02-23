import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AgentProfile {
  id: string;
  name: string;
  url: string;       // ws://host:port/ws
  clientId: string;
  token: string;
  active: boolean;
}

interface SettingsState {
  agents: AgentProfile[];
  attachLocation: boolean;
  attachCalendar: boolean;
  hydrated: boolean;
  addAgent: (agent: AgentProfile) => void;
  updateAgent: (id: string, patch: Partial<AgentProfile>) => void;
  removeAgent: (id: string) => void;
  toggleAgent: (id: string, active: boolean) => void;
  toggleAttachLocation: () => void;
  toggleAttachCalendar: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'clawmobile:settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  agents: [],
  attachLocation: true,
  attachCalendar: true,
  hydrated: false,

  addAgent: (agent) => {
    set((s) => ({ agents: [...s.agents, agent] }));
    persist(get());
  },

  updateAgent: (id, patch) => {
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    persist(get());
  },

  removeAgent: (id) => {
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) }));
    persist(get());
  },

  toggleAgent: (id, active) => {
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, active } : a)),
    }));
    persist(get());
  },

  toggleAttachLocation: () => {
    set((s) => ({ attachLocation: !s.attachLocation }));
    persist(get());
  },

  toggleAttachCalendar: () => {
    set((s) => ({ attachCalendar: !s.attachCalendar }));
    persist(get());
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ ...saved, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
}));

function persist(state: SettingsState) {
  const { hydrated, hydrate, addAgent, updateAgent, removeAgent, toggleAgent, toggleAttachLocation, toggleAttachCalendar, ...data } = state;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => { });
}
