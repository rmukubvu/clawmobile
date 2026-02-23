import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useChatStore } from '@/store/chat';
import { useSettingsStore } from '@/store/settings';
import { Message } from '@/types/message';
import { TaskStateService, TaskStatus } from '@/services/TaskStateService';

/**
 * Tasks screen — shows agent messages that look like task results or
 * notifications (non-conversational output).
 */
export default function TasksScreen() {
  const router = useRouter();
  const messages = useChatStore((s) => s.messages);
  const agents = useSettingsStore((s) => s.agents);
  const [taskStates, setTaskStates] = React.useState<Record<string, TaskStatus>>({});
  const [filter, setFilter] = React.useState<'pending' | 'done' | 'all'>('pending');

  React.useEffect(() => {
    let cancelled = false;
    TaskStateService.getAll().then((data) => {
      if (!cancelled) setTaskStates(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const agentNameById = React.useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );

  const taskItems = React.useMemo(() => {
    const items = messages
      .filter((m) => !m.isOwn)
      .map((m) => toTaskEvent(m))
      .filter((event): event is TaskEvent => event !== null)
      .sort((a, b) => b.message.timestamp - a.message.timestamp);
    return items;
  }, [messages]);

  const visibleItems = React.useMemo(() => {
    const withStatus = taskItems
      .map((event) => ({
        ...event,
        status: taskStates[event.message.id] ?? 'pending' as TaskStatus,
      }))
      .filter((event) => event.status !== 'dismissed');

    if (filter === 'all') return withStatus;
    return withStatus.filter((event) => event.status === filter);
  }, [filter, taskItems, taskStates]);

  const pendingCount = React.useMemo(
    () => taskItems.filter((event) => (taskStates[event.message.id] ?? 'pending') === 'pending').length,
    [taskItems, taskStates],
  );
  const doneCount = React.useMemo(
    () => taskItems.filter((event) => (taskStates[event.message.id] ?? 'pending') === 'done').length,
    [taskItems, taskStates],
  );

  const isEmpty = visibleItems.length === 0;

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setTaskStates((prev) => ({ ...prev, [taskId]: status }));
    await TaskStateService.setStatus(taskId, status);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks & Notifications</Text>
        <View style={styles.filters}>
          <FilterChip active={filter === 'pending'} label={`Pending (${pendingCount})`} onPress={() => setFilter('pending')} />
          <FilterChip active={filter === 'done'} label={`Done (${doneCount})`} onPress={() => setFilter('done')} />
          <FilterChip active={filter === 'all'} label="All" onPress={() => setFilter('all')} />
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, isEmpty && styles.contentEmpty]}>
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{filter === 'pending' ? 'No pending tasks' : 'No task events yet'}</Text>
            <Text style={styles.empty}>
              Agent task results and notifications will appear here when background work completes.
            </Text>
            <View style={styles.actions}>
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/index')}>
                <Text style={styles.primaryBtnText}>Open Chats</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => router.push(agents.length === 0 ? '/agents' : '/index')}
              >
                <Text style={styles.secondaryBtnText}>{agents.length === 0 ? 'Connect Agent' : 'Send Prompt'}</Text>
              </Pressable>
            </View>
          </View>
        ) : visibleItems.map((event) => {
          const agentName = agentNameById.get(event.message.agentId) ?? 'Agent';
          return (
            <Swipeable
              key={event.message.id}
              overshootRight={false}
              renderRightActions={() => (
                <View style={styles.rowActions}>
                  <Pressable
                    style={[styles.actionBtn, styles.doneBtn]}
                    onPress={() => updateTaskStatus(event.message.id, 'done')}
                  >
                    <Text style={styles.actionBtnText}>Done</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.dismissBtn]}
                    onPress={() => updateTaskStatus(event.message.id, 'dismissed')}
                  >
                    <Text style={styles.actionBtnText}>Dismiss</Text>
                  </Pressable>
                </View>
              )}
            >
              <View key={event.message.id} style={[styles.card, event.status === 'done' && styles.cardDone]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardBadge}>{event.icon} {event.label}</Text>
                  <Text style={styles.cardAgent}>{agentName}</Text>
                </View>
                <Text style={[styles.cardText, event.status === 'done' && styles.cardTextDone]}>{event.body}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardTime}>{new Date(event.message.timestamp).toLocaleString()}</Text>
                  <Text style={[styles.statusPill, event.status === 'done' ? styles.statusDone : styles.statusPending]}>
                    {event.status === 'done' ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </View>
            </Swipeable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

type TaskKind = 'daily_brief' | 'goal_checkin' | 'workflow_result' | 'notification';

type TaskEvent = {
  kind: TaskKind;
  label: string;
  icon: string;
  body: string;
  message: Message;
  status?: TaskStatus;
};

function toTaskEvent(message: Message): TaskEvent | null {
  const modelTag = (message.metadata?.model ?? '').trim();
  const content = (message.content ?? '').trim();
  const kind = inferKind(modelTag, content);
  if (!kind) return null;

  const body = stripTaskPrefix(kind, content);
  switch (kind) {
    case 'daily_brief':
      return { kind, label: 'Daily Brief', icon: '🗓️', body, message };
    case 'goal_checkin':
      return { kind, label: 'Goal Check-In', icon: '🎯', body, message };
    case 'workflow_result':
      return { kind, label: 'Workflow Update', icon: '⚙️', body, message };
    case 'notification':
      return { kind, label: 'Notification', icon: '🔔', body, message };
    default:
      return null;
  }
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function inferKind(modelTag: string, content: string): TaskKind | null {
  const normalized = modelTag.toLowerCase();
  if (normalized === 'daily_brief') return 'daily_brief';
  if (normalized === 'goal_checkin') return 'goal_checkin';
  if (normalized === 'workflow_result') return 'workflow_result';
  if (normalized === 'notification') return 'notification';

  if (content.startsWith('🗓️ Daily Brief')) return 'daily_brief';
  if (content.startsWith('🎯 Goal Check-in')) return 'goal_checkin';
  if (content.startsWith('⚙️ Workflow Update')) return 'workflow_result';

  return null;
}

function stripTaskPrefix(kind: TaskKind, content: string): string {
  const cleaned = content.trim();
  if (kind === 'daily_brief') {
    return cleaned.replace(/^🗓️\s*Daily Brief\s*/i, '').trim();
  }
  if (kind === 'goal_checkin') {
    return cleaned.replace(/^🎯\s*Goal Check-in\s*/i, '').trim();
  }
  if (kind === 'workflow_result') {
    return cleaned.replace(/^⚙️\s*Workflow Update\s*/i, '').trim();
  }
  return cleaned;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 10 },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111b38',
  },
  filterChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.22)' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#e2e8f0' },
  content: { padding: 16, gap: 10 },
  contentEmpty: { flexGrow: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  emptyTitle: { color: '#cbd5e1', fontSize: 18, fontWeight: '700' },
  empty: { color: '#64748b', textAlign: 'center', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#334155',
  },
  secondaryBtnText: { color: '#cbd5e1', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, gap: 6 },
  cardDone: { opacity: 0.72, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBadge: { color: '#c7d2fe', fontSize: 12, fontWeight: '700' },
  cardAgent: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  cardText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  cardTextDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTime: { color: '#475569', fontSize: 11 },
  statusPill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  statusPending: { color: '#fef3c7', backgroundColor: 'rgba(245,158,11,0.18)' },
  statusDone: { color: '#bbf7d0', backgroundColor: 'rgba(34,197,94,0.18)' },
  rowActions: { flexDirection: 'row', alignItems: 'stretch', marginLeft: 8, marginBottom: 2, marginTop: 2 },
  actionBtn: { width: 82, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 },
  doneBtn: { backgroundColor: '#166534' },
  dismissBtn: { backgroundColor: '#b91c1c' },
  actionBtnText: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
});
