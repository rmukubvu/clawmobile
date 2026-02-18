import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  connected: boolean;
  connecting?: boolean;
}

export function ConnectionDot({ connected, connecting }: Props) {
  const color = connected ? '#22c55e' : connecting ? '#f59e0b' : '#ef4444';
  const label = connected ? 'Online' : connecting ? 'Connecting…' : 'Offline';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '500' },
});
