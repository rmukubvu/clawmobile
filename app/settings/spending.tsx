import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSettingsStore } from '@/store/settings';
import { getPaymentPolicy, getPaymentStatus, updatePaymentPolicy, type PaymentPolicy, type PaymentStatus } from '@/services/payments';

export default function SpendingControlsScreen() {
  const { agents } = useSettingsStore();
  const preferredAgent = useMemo(() => {
    if (agents.length === 0) return null;
    return agents.find((a) => a.active) ?? agents[0];
  }, [agents]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>(preferredAgent?.id ?? '');
  const selectedAgent = useMemo(() => agents.find((a) => a.id === selectedAgentId) ?? null, [agents, selectedAgentId]);

  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState<string>('');
  const [walletStatus, setWalletStatus] = useState<PaymentStatus | null>(null);

  const [maxPerTx, setMaxPerTx] = useState('50');
  const [maxDaily, setMaxDaily] = useState('120');
  const [maxMonthly, setMaxMonthly] = useState('500');
  const [requireConfirmationOver, setRequireConfirmationOver] = useState('20');
  const [allowedMerchants, setAllowedMerchants] = useState('amazon,ticketmaster');
  const [allowedCategories, setAllowedCategories] = useState('shopping,tickets');
  const [timezone, setTimezone] = useState('UTC');
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');

  useEffect(() => {
    if (!selectedAgentId && preferredAgent?.id) {
      setSelectedAgentId(preferredAgent.id);
    }
  }, [preferredAgent?.id, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgent) return;
    let cancelled = false;

    setLoadingPolicy(true);
    setPolicyError('');

    Promise.all([getPaymentPolicy(selectedAgent), getPaymentStatus(selectedAgent)])
      .then(([policy, status]) => {
        if (cancelled) return;
        bindPolicyForm(policy);
        setWalletStatus(status);
      })
      .catch((error) => {
        if (cancelled) return;
        setPolicyError(error instanceof Error ? error.message : 'Failed to load spending controls.');
        setWalletStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingPolicy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAgent?.id]);

  function bindPolicyForm(policy: PaymentPolicy) {
    setMaxPerTx(String(policy.max_per_tx ?? 0));
    setMaxDaily(String(policy.max_daily ?? 0));
    setMaxMonthly(String(policy.max_monthly ?? 0));
    setRequireConfirmationOver(String(policy.require_confirmation_over ?? 0));
    setAllowedMerchants((policy.allowed_merchants ?? []).join(','));
    setAllowedCategories((policy.allowed_categories ?? []).join(','));
    setTimezone(policy.timezone || 'UTC');
    setQuietStart(policy.quiet_hours_start == null ? '' : String(policy.quiet_hours_start));
    setQuietEnd(policy.quiet_hours_end == null ? '' : String(policy.quiet_hours_end));
  }

  function parseAmount(value: string): number {
    const numeric = Number(value.trim());
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new Error('Amounts must be valid positive numbers.');
    }
    return Number(numeric.toFixed(2));
  }

  function parseHour(value: string): number | null {
    if (!value.trim()) return null;
    const numeric = Number(value.trim());
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 23) {
      throw new Error('Quiet hours must be integers between 0 and 23.');
    }
    return numeric;
  }

  async function onSavePolicy() {
    if (!selectedAgent) return;

    try {
      setSavingPolicy(true);
      setPolicyError('');

      const payload: PaymentPolicy = {
        currency: 'USD',
        max_per_tx: parseAmount(maxPerTx),
        max_daily: parseAmount(maxDaily),
        max_monthly: parseAmount(maxMonthly),
        require_confirmation_over: parseAmount(requireConfirmationOver),
        allowed_merchants: allowedMerchants.split(',').map((v) => v.trim()).filter(Boolean),
        allowed_categories: allowedCategories.split(',').map((v) => v.trim()).filter(Boolean),
        timezone: timezone.trim() || 'UTC',
        quiet_hours_start: parseHour(quietStart),
        quiet_hours_end: parseHour(quietEnd),
      };

      const saved = await updatePaymentPolicy(selectedAgent, payload);
      bindPolicyForm(saved);
      const status = await getPaymentStatus(selectedAgent);
      setWalletStatus(status);
      Alert.alert('Saved', 'Spending controls updated.');
    } catch (error) {
      setPolicyError(error instanceof Error ? error.message : 'Failed to save spending controls.');
    } finally {
      setSavingPolicy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#f1f5f9" />
        </Pressable>
        <Text style={styles.title}>Spending Controls</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {agents.length === 0 ? (
            <Text style={styles.settingDesc}>Connect at least one agent to configure spending controls.</Text>
          ) : (
            <>
              <Text style={styles.settingLabel}>Agent</Text>
              <View style={styles.agentListRow}>
                {agents.map((agent) => (
                  <Pressable
                    key={agent.id}
                    onPress={() => setSelectedAgentId(agent.id)}
                    style={[styles.agentChip, selectedAgentId === agent.id && styles.agentChipActive]}
                  >
                    <Text style={[styles.agentChipText, selectedAgentId === agent.id && styles.agentChipTextActive]}>
                      {agent.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {loadingPolicy ? <Text style={styles.settingDesc}>Loading policy...</Text> : null}
              {policyError ? <Text style={styles.errorText}>{policyError}</Text> : null}

              {!loadingPolicy && selectedAgent ? (
                <>
                  <Field label="Max Per Transaction (USD)" value={maxPerTx} onChangeText={setMaxPerTx} keyboardType="decimal-pad" />
                  <Field label="Max Daily (USD)" value={maxDaily} onChangeText={setMaxDaily} keyboardType="decimal-pad" />
                  <Field label="Max Monthly (USD)" value={maxMonthly} onChangeText={setMaxMonthly} keyboardType="decimal-pad" />
                  <Field
                    label="Require Confirmation Over (USD)"
                    value={requireConfirmationOver}
                    onChangeText={setRequireConfirmationOver}
                    keyboardType="decimal-pad"
                  />
                  <Field
                    label="Allowed Merchants (comma separated)"
                    value={allowedMerchants}
                    onChangeText={setAllowedMerchants}
                    autoCapitalize="none"
                  />
                  <Field
                    label="Allowed Categories (comma separated)"
                    value={allowedCategories}
                    onChangeText={setAllowedCategories}
                    autoCapitalize="none"
                  />
                  <Field label="Timezone" value={timezone} onChangeText={setTimezone} autoCapitalize="none" />

                  <View style={styles.splitRow}>
                    <Field label="Quiet Start (0-23)" value={quietStart} onChangeText={setQuietStart} keyboardType="number-pad" compact />
                    <Field label="Quiet End (0-23)" value={quietEnd} onChangeText={setQuietEnd} keyboardType="number-pad" compact />
                  </View>

                  <Pressable style={[styles.primaryButton, savingPolicy && styles.primaryButtonDisabled]} onPress={onSavePolicy} disabled={savingPolicy}>
                    <Text style={styles.primaryButtonText}>{savingPolicy ? 'Saving...' : 'Save Spending Controls'}</Text>
                  </Pressable>

                  {walletStatus ? (
                    <View style={styles.statusBox}>
                      <Row label="Daily Used" value={`${walletStatus.daily_used.toFixed(2)} USD`} />
                      <Row label="Daily Available" value={`${walletStatus.available_daily.toFixed(2)} USD`} />
                      <Row label="Monthly Used" value={`${walletStatus.monthly_used.toFixed(2)} USD`} />
                      <Row label="Monthly Available" value={`${walletStatus.available_monthly.toFixed(2)} USD`} />
                      <Row label="Transactions" value={String(walletStatus.transactions)} />
                    </View>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  compact,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  compact?: boolean;
}) {
  return (
    <View style={[styles.fieldWrap, compact && styles.fieldWrapCompact]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.fieldInput}
        placeholderTextColor="#475569"
      />
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
  header: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 120 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    gap: 10,
  },
  splitRow: { flexDirection: 'row', gap: 10 },
  fieldWrap: { gap: 4 },
  fieldWrapCompact: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  fieldInput: {
    backgroundColor: '#0b1735',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  agentListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  agentChip: { borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  agentChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.2)' },
  agentChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  agentChipTextActive: { color: '#e2e8f0' },
  primaryButton: { marginTop: 6, backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  statusBox: { marginTop: 4, backgroundColor: '#0b1735', borderRadius: 10, padding: 10, gap: 8, borderWidth: 1, borderColor: '#334155' },
  errorText: { color: '#f87171', fontSize: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  settingDesc: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
});
