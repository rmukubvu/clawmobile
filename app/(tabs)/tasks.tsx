import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useChatStore } from '@/store/chat';

/**
 * Tasks screen — shows agent messages that look like task results or
 * notifications (non-conversational output). In future iterations this
 * will integrate with spawn/subagent results from PicoClaw.
 */
export default function TasksScreen() {
  const messages = useChatStore((s) => s.messages);

  const notifications = messages.filter(
    (m) => m.role === 'agent' && m.content.startsWith('['),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks & Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {notifications.length === 0 ? (
          <Text style={styles.empty}>
            Agent task results and notifications will appear here when your agent completes background work.
          </Text>
        ) : (
          notifications.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.cardText}>{m.content}</Text>
              <Text style={styles.cardTime}>
                {new Date(m.timestamp).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  content: { padding: 16, gap: 10 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, gap: 6 },
  cardText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  cardTime: { color: '#475569', fontSize: 11 },
});
