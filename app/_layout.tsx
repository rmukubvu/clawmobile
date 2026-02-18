import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/store/settings';
import {
  requestNotificationPermission,
  setupNotificationListeners,
} from '@/services/notifications';

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    requestNotificationPermission();

    const cleanup = setupNotificationListeners((screen) => {
      // Navigate to the right tab when user taps a notification
      router.push(screen === 'chat' ? '/(tabs)/' : `/(tabs)/${screen}`);
    });

    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
