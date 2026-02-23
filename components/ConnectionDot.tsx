import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  connected: boolean;
  connecting?: boolean;
  latency?: number | null;
}

export function ConnectionDot({ connected, connecting, latency }: Props) {
  let color = '#ef4444'; // Red (Offline)
  let label = 'Offline';

  if (connecting) {
    color = '#f59e0b'; // Yellow
    label = 'Connecting…';
  } else if (connected) {
    if (latency && latency > 1000) {
      color = '#f59e0b'; // Yellow (Poor)
      label = 'Weak Signal';
    } else if (latency && latency > 300) {
      color = '#eab308'; // Darker Yellow (Fair)
      label = 'Fair';
    } else {
      color = '#22c55e'; // Green (Good)
      label = 'Online';
    }
  }

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
