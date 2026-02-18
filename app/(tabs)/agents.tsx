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
import { useSettingsStore, type AgentProfile } from '@/store/settings';

let _idN = Date.now();

export default function AgentsScreen() {
  const { agents, addAgent, removeAgent, setActiveAgent } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    url: 'ws://192.168.1.10:18792/ws',
    clientId: '',
    token: '',
  });

  function handleAdd() {
    if (!form.name || !form.url || !form.clientId) {
      Alert.alert('Missing fields', 'Name, URL and Client ID are required.');
      return;
    }
    const agent: AgentProfile = {
      id: String(++_idN),
      name: form.name,
      url: form.url,
      clientId: form.clientId,
      token: form.token,
      active: agents.length === 0,
    };
    addAgent(agent);
    setForm({ name: '', url: 'ws://192.168.1.10:18792/ws', clientId: '', token: '' });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    Alert.alert('Remove agent', 'Remove this connection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeAgent(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Agents</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addBtnText}>{showForm ? '✕' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>New Agent Connection</Text>
            <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="My PicoClaw" />
            <Field label="WebSocket URL" value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} placeholder="ws://host:18792/ws" autoCapitalize="none" />
            <Field label="Client ID" value={form.clientId} onChange={(v) => setForm((f) => ({ ...f, clientId: v }))} placeholder="alice" autoCapitalize="none" />
            <Field label="Token (optional)" value={form.token} onChange={(v) => setForm((f) => ({ ...f, token: v }))} placeholder="" autoCapitalize="none" secureTextEntry />
            <Pressable style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        )}

        {agents.length === 0 && !showForm && (
          <Text style={styles.empty}>No agents configured yet. Tap "+ Add" to connect to a PicoClaw instance.</Text>
        )}

        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onActivate={() => setActiveAgent(agent.id)}
            onDelete={() => handleDelete(agent.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AgentCard({
  agent,
  onActivate,
  onDelete,
}: {
  agent: AgentProfile;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, agent.active && styles.cardActive]}>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{agent.name}</Text>
        <Text style={styles.cardUrl} numberOfLines={1}>{agent.url}</Text>
        <Text style={styles.cardMeta}>client_id: {agent.clientId}</Text>
      </View>
      <View style={styles.cardActions}>
        <Switch value={agent.active} onValueChange={onActivate} trackColor={{ true: '#6366f1' }} />
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
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
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  cardUrl: { fontSize: 12, color: '#64748b' },
  cardMeta: { fontSize: 12, color: '#475569' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#ef4444', fontSize: 16 },
});
