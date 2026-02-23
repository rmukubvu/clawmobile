import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useSettingsStore, type AgentProfile } from '@/store/settings';
import { useChatStore } from '@/store/chat';

let _idN = Date.now();

type FormState = { name: string; url: string; clientId: string; token: string };
const BLANK: FormState = { name: '', url: 'ws://localhost:8787/ws', clientId: '', token: '' };

export default function AgentsScreen() {
  const { agents, addAgent, updateAgent, removeAgent, toggleAgent } = useSettingsStore();
  const { agentConnected, agentLatency } = useChatStore();
  // null = hidden, 'add' = new agent form, agent.id = edit that agent
  const [editing, setEditing] = useState<null | 'add' | string>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function openAdd() {
    setForm(BLANK);
    setEditing('add');
  }

  function openEdit(agent: AgentProfile) {
    setForm({ name: agent.name, url: agent.url, clientId: agent.clientId, token: agent.token });
    setEditing(agent.id);
  }

  function handleClose() {
    setEditing(null);
    setForm(BLANK);
  }

  function handleSave() {
    if (!form.name || !form.url || !form.clientId) {
      Alert.alert('Missing fields', 'Name, URL and Client ID are required.');
      return;
    }
    if (editing === 'add') {
      const agent: AgentProfile = {
        id: String(++_idN),
        name: form.name,
        url: form.url,
        clientId: form.clientId,
        token: form.token,
        active: agents.length === 0,
      };
      addAgent(agent);
    } else if (editing) {
      updateAgent(editing, { name: form.name, url: form.url, clientId: form.clientId, token: form.token });
    }
    handleClose();
  }

  function handleDelete(id: string) {
    Alert.alert('Remove agent', 'Remove this connection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removeAgent(id); if (editing === id) handleClose(); } },
    ]);
  }

  const isFormOpen = editing !== null;
  const formTitle = editing === 'add' ? 'New Agent' : 'Edit Agent';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Agents</Text>
        <Pressable style={styles.addBtn} onPress={isFormOpen ? handleClose : openAdd}>
          <Text style={styles.addBtnText}>{isFormOpen ? '✕ Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isFormOpen && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{formTitle}</Text>
            <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="My ClawMobile" />
            <Field label="WebSocket URL" value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} placeholder="ws://host:8787/ws" autoCapitalize="none" />
            <Field label="Client ID" value={form.clientId} onChange={(v) => setForm((f) => ({ ...f, clientId: v }))} placeholder="alice" autoCapitalize="none" />
            <Field label="Token (optional)" value={form.token} onChange={(v) => setForm((f) => ({ ...f, token: v }))} autoCapitalize="none" secureTextEntry />
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        )}

        {agents.length === 0 && !isFormOpen && (
          <Text style={styles.empty}>No agents configured yet. Tap "+ Add" to connect to your Cognis server.</Text>
        )}

        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isEditing={editing === agent.id}
            onEdit={() => openEdit(agent)}
            onToggle={(val) => toggleAgent(agent.id, val)}
            onDelete={() => handleDelete(agent.id)}
            connected={agentConnected[agent.id] ?? false}
            latencyMs={agentLatency[agent.id]}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AgentCard({
  agent,
  isEditing,
  onEdit,
  onToggle,
  onDelete,
  connected,
  latencyMs,
}: {
  agent: AgentProfile;
  isEditing: boolean;
  onEdit: () => void;
  onToggle: (val: boolean) => void;
  onDelete: () => void;
  connected: boolean;
  latencyMs?: number;
}) {
  const statusLabel = connected
    ? `Connected${typeof latencyMs === 'number' && latencyMs > 0 ? ` · ${Math.round(latencyMs)} ms` : ''}`
    : 'Disconnected';

  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        styles.card,
        agent.active && styles.cardActive,
        isEditing && styles.cardEditing,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{agent.name}</Text>
        <Text style={styles.cardUrl} numberOfLines={1}>{agent.url}</Text>
        <Text style={styles.cardMeta}>client_id: {agent.clientId}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, connected ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {/* Pencil icon shows edit affordance */}
        <Pencil color="#64748b" size={14} strokeWidth={2} style={{ marginRight: 4 }} />
        <Switch
          value={agent.active}
          onValueChange={onToggle}
          trackColor={{ true: '#6366f1', false: '#334155' }}
        />
        <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        autoCapitalize={autoCapitalize ?? 'sentences'}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  content: { padding: 16, gap: 12 },
  form: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, gap: 10 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  fieldInput: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#f1f5f9', fontSize: 14 },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  cardActive: { borderColor: '#6366f1' },
  cardEditing: { borderColor: '#a5b4fc', backgroundColor: '#1e2a40' },
  cardPressed: { opacity: 0.8 },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  cardUrl: { fontSize: 12, color: '#64748b' },
  cardMeta: { fontSize: 12, color: '#475569' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusOnline: { backgroundColor: '#22c55e' },
  statusOffline: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 12, color: '#94a3b8' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#ef4444', fontSize: 16 },
});
