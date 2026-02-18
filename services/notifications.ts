import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * While the app is in the foreground we show messages directly in the chat UI,
 * so foreground banners are suppressed. Background messages get a local
 * notification scheduled immediately (trigger: null).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowList: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Show a local notification immediately — used when the app is backgrounded. */
export async function showLocalNotification(agentName: string, content: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: agentName,
      body: content.length > 200 ? content.slice(0, 197) + '…' : content,
      sound: true,
      data: { screen: 'chat' },
    },
    trigger: null, // fire immediately
  });
}

/**
 * Call once at app startup. Returns a cleanup function.
 * When the user taps a notification, `onTap` is called with the screen name
 * stored in the notification data (e.g. 'chat').
 */
export function setupNotificationListeners(onTap: (screen: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen as string | undefined;
    onTap(screen ?? 'chat');
  });

  return () => sub.remove();
}
