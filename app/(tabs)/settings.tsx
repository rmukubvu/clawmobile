import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSettingsStore } from '@/store/settings';
import { useChatStore } from '@/store/chat';

export default function SettingsScreen() {
  const { agentConnected, connected } = useChatStore();
  const { attachLocation, attachCalendar, toggleAttachLocation, toggleAttachCalendar } = useSettingsStore();
  const connectedAgents = Object.values(agentConnected).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Controls</SectionTitle>
        <View style={styles.group}>
          <MenuRow
            icon="card-outline"
            label="Spending Controls"
            description="Configure payment limits and confirmation rules"
            onPress={() => router.push('/settings/spending')}
          />
        </View>

        <SectionTitle>Context</SectionTitle>
        <View style={styles.group}>
          <SwitchRow
            icon="location-outline"
            label="Attach Location"
            description="Share GPS coordinates with each message"
            value={attachLocation}
            onChange={toggleAttachLocation}
          />
          <Divider />
          <SwitchRow
            icon="calendar-outline"
            label="Attach Calendar"
            description="Share upcoming events for schedule-aware help"
            value={attachCalendar}
            onChange={toggleAttachCalendar}
          />
        </View>

        <SectionTitle>About</SectionTitle>
        <View style={styles.group}>
          <InfoRow label="App" value="Cognis Mobile" />
          <Divider />
          <InfoRow label="Protocol" value="WebSocket / JSON" />
          <Divider />
          <InfoRow label="Connection" value={connected ? 'Active' : 'Offline'} valueColor={connected ? '#22c55e' : '#ef4444'} />
          <Divider />
          <InfoRow label="Agents Online" value={String(connectedAgents)} />
        </View>

        <Text style={styles.footer}>Cognis mobile control center</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function MenuRow({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.iconPill}>
          <Ionicons name={icon} size={18} color="#cbd5e1" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowDescription}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </Pressable>
  );
}

function SwitchRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconPill}>
          <Ionicons name={icon} size={18} color="#cbd5e1" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowDescription}>{description}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#6366f1' }} />
    </View>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  content: { padding: 16, gap: 10 },
  sectionTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  group: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  row: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0b1735',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  rowDescription: { fontSize: 12, color: '#64748b' },
  divider: { height: 1, backgroundColor: '#334155', marginLeft: 58 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  footer: { textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 20, marginBottom: 12 },
});
