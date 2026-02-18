import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { useChatStore } from '@/store/chat';

export default function SettingsScreen() {
  const { attachLocation, attachCalendar, toggleAttachLocation, toggleAttachCalendar } =
    useSettingsStore();
  const { connected } = useChatStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Context Attachments</SectionTitle>
        <SettingRow
          label="Attach Location"
          description="Send your GPS coordinates with each message so your agent can give location-aware suggestions."
          value={attachLocation}
          onChange={toggleAttachLocation}
        />
        <SettingRow
          label="Attach Calendar"
          description="Send today's upcoming events so your agent can help manage your schedule."
          value={attachCalendar}
          onChange={toggleAttachCalendar}
        />

        <SectionTitle>About</SectionTitle>
        <View style={styles.card}>
          <Row label="App" value="PicoClaw Mobile" />
          <Row label="Protocol" value="WebSocket / JSON" />
          <Row label="Connection" value={connected ? 'Active' : 'Offline'} valueColor={connected ? '#22c55e' : '#ef4444'} />
        </View>

        <Text style={styles.footer}>
          PicoClaw — Ultra-lightweight personal AI agent{'\n'}
          github.com/sipeed/picoclaw
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SettingRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.settingRow}>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDesc}>{description}</Text>
        </View>
        <Switch value={value} onValueChange={onChange} trackColor={{ true: '#6366f1' }} />
      </View>
    </View>
  );
}

function Row({
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
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 8 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, gap: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { flex: 1, gap: 3 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  settingDesc: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  footer: { textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24, lineHeight: 18 },
});
