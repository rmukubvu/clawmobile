import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentConnection } from '@/services/websocket';
import { getLocationString } from '@/services/location';
import { getUpcomingEventsString } from '@/services/calendar';
import { showLocalNotification } from '@/services/notifications';
import { useChatStore } from '@/store/chat';
import { useSettingsStore } from '@/store/settings';
import { MessageBubble } from '@/components/MessageBubble';
import { ConnectionDot } from '@/components/ConnectionDot';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const connRef = useRef<AgentConnection | null>(null);
  const listRef = useRef<FlatList>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const { messages, connected, connecting, addMessage, setConnected, setConnecting } =
    useChatStore();
  const { agents, attachLocation, attachCalendar } = useSettingsStore();

  const activeAgent = agents.find((a) => a.active) ?? agents[0];

  // Track foreground/background state so we can decide whether
  // to show a notification or render directly in the chat list.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // Connect / reconnect when active agent changes
  useEffect(() => {
    if (!activeAgent) return;

    connRef.current?.disconnect();
    setConnecting(true);

    addMessage({ role: 'system', content: `Connecting to ${activeAgent.name}…` });

    const conn = new AgentConnection({
      url: activeAgent.url,
      clientId: activeAgent.clientId,
      token: activeAgent.token || undefined,
    });

    conn.onStatusChange = (isConnected) => {
      setConnected(isConnected);
      addMessage({
        role: 'system',
        content: isConnected ? `Connected to ${activeAgent.name}` : `Disconnected — retrying…`,
      });
    };

    conn.onMessage = (msg) => {
      if (msg.type !== 'message' && msg.type !== 'notification') return;

      const isBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';

      if (isBackground) {
        // App is not visible — fire a local push notification
        showLocalNotification(activeAgent.name, msg.content);
      } else {
        // App is in foreground — render in chat
        addMessage({ role: 'agent', content: msg.content, agentId: activeAgent.id });
      }
    };

    connRef.current = conn;
    conn.connect();

    return () => {
      conn.disconnect();
      connRef.current = null;
    };
  }, [activeAgent?.id]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !connRef.current?.connected) return;

    setInput('');
    addMessage({ role: 'user', content: text });

    const metadata: Record<string, string> = {};

    if (attachLocation) {
      const loc = await getLocationString();
      if (loc) metadata.location = loc;
    }

    if (attachCalendar) {
      const cal = await getUpcomingEventsString(1);
      if (cal) metadata.calendar = cal;
    }

    connRef.current.sendMessage(text, Object.keys(metadata).length ? metadata : undefined);
  }, [input, attachLocation, attachCalendar]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{activeAgent?.name ?? 'PicoClaw'}</Text>
          <ConnectionDot connected={connected} connecting={connecting} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          style={styles.flex}
        />

        {/* No agent configured yet */}
        {!activeAgent && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No agent connected</Text>
            <Text style={styles.emptyText}>
              Go to the Agents tab to add your PicoClaw connection.
            </Text>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor="#475569"
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || !connected) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || !connected}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  listContent: { paddingTop: 8, paddingBottom: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#334155' },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emptyState: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#475569', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#334155', textAlign: 'center', lineHeight: 20 },
});
