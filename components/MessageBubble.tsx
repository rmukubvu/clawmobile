import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '@/store/chat';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
          {message.content}
        </Text>
        <Text style={styles.time}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    flexDirection: 'row',
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAgent: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  bubbleAgent: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 20 },
  textUser: { color: '#fff' },
  textAgent: { color: '#e2e8f0' },
  time: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  systemRow: { alignItems: 'center', paddingVertical: 6 },
  systemText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
});
