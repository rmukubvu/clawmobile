import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSettingsStore } from '@/store/settings';
import { MessageStorageService as StorageService } from '@/services/MessageStorageService';

interface AgentPreview {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: number;
}

const stripSystemPrefix = (text?: string) => {
  if (!text) return text;
  return text.replace(/^\[[^\]]+\]\s*/u, '').trim();
};

export default function ChatListScreen() {
  const router = useRouter();
  const { agents } = useSettingsStore();
  const [previews, setPreviews] = useState<AgentPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPreviews = useCallback(async () => {
    const data: AgentPreview[] = [];
    for (const agent of agents) {
      const lastMsg = await StorageService.getLastMessage(agent.id);
      data.push({
        id: agent.id,
        name: agent.name,
        lastMessage: stripSystemPrefix(lastMsg?.content),
        timestamp: lastMsg?.timestamp,
      });
    }

    data.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    setPreviews(data);
  }, [agents]);

  useFocusEffect(
    useCallback(() => {
      loadPreviews();
    }, [loadPreviews]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPreviews();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: AgentPreview }) => (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          {item.timestamp && (
            <Text style={styles.time}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessage ?? 'Start a conversation'}
        </Text>
      </View>
    </Pressable>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No chats yet</Text>
      <Text style={styles.emptySub}>Connect an agent first, then send your first message.</Text>
      <View style={styles.emptyActions}>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/agents')}>
          <Text style={styles.primaryBtnText}>Open Agents</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onRefresh}>
          <Text style={styles.secondaryBtnText}>Refresh</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>

      {agents.length === 0 ? (
        EmptyState
      ) : (
        <FlatList
          data={previews}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, previews.length === 0 && styles.listEmpty]}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#f1f5f9' },
  list: { paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  itemPressed: { backgroundColor: '#1e293b' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  time: { fontSize: 12, color: '#64748b' },
  preview: { fontSize: 14, color: '#94a3b8' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  emptyTitle: { color: '#cbd5e1', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
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
});
