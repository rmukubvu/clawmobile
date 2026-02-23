import AsyncStorage from '@react-native-async-storage/async-storage';

export type TaskStatus = 'pending' | 'done' | 'dismissed';

const STORAGE_KEY = 'clawmobile:task-status:v1';

export const TaskStateService = {
  async getAll(): Promise<Record<string, TaskStatus>> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, TaskStatus>;
      return parsed ?? {};
    } catch {
      return {};
    }
  },

  async setStatus(taskId: string, status: TaskStatus): Promise<void> {
    if (!taskId) return;
    const all = await this.getAll();
    all[taskId] = status;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // no-op
    }
  },
};
