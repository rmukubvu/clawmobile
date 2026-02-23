import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useSettingsStore } from '@/store/settings';
import {
  requestNotificationPermission,
  setupNotificationListeners,
} from '@/services/notifications';
import { connectionManager } from '@/services/ConnectionManager';

export default function RootLayout() {
  /* Global Connection Manager — connects ALL enabled agents simultaneously */
  const agents = useSettingsStore((s) => s.agents);
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    requestNotificationPermission();

    const cleanup = setupNotificationListeners((screen, data) => {
      const agentId = data?.agentId as string | undefined;
      if (agentId) {
        router.push({ pathname: '/chat/[id]', params: { id: agentId } });
      } else {
        router.push(screen === 'chat' ? '/(tabs)/' : `/(tabs)/${screen}`);
      }
    });

    return cleanup;
  }, []);

  // Keep connections in sync with agent list + active flags
  useEffect(() => {
    const enabledIds = new Set(agents.filter((a) => a.active).map((a) => a.id));

    // Connect any newly-enabled agents
    for (const agent of agents) {
      if (agent.active) {
        connectionManager.connect(agent);
      } else {
        // Disconnect agents that were toggled off
        if (connectionManager.isConnected(agent.id)) {
          connectionManager.disconnect(agent.id);
        }
      }
    }
  }, [agents]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
