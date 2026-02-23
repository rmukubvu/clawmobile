import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message, MessageStatus } from '@/types/message';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react-native';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.isOwn;
  // @ts-ignore - role might be missing in Message type
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  const renderStatus = () => {
    if (!isUser) return null;

    const size = 12;
    const color = 'rgba(255,255,255,0.7)';
    // Blue for read
    const readColor = '#60a5fa';

    switch (message.status) {
      case MessageStatus.PENDING:
        return <Clock size={size} color={color} />;
      case MessageStatus.SENDING:
        return <Clock size={size} color={color} />;
      case MessageStatus.SENT:
        return <Check size={size} color={color} />;
      case MessageStatus.DELIVERED:
        return <CheckCheck size={size} color={color} />;
      case MessageStatus.READ:
        return <CheckCheck size={size} color={readColor} />;
      case MessageStatus.FAILED:
        return <AlertCircle size={size} color="#f87171" />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
          {message.content}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.time}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isUser && <View style={styles.statusIcon}>{renderStatus()}</View>}
        </View>
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
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  statusIcon: {
    opacity: 0.9,
  },
  systemRow: { alignItems: 'center', paddingVertical: 6 },
  systemText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
});
