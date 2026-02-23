import { Tabs, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TABS: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index',    label: 'Chat',     icon: 'chatbubble-outline',      iconActive: 'chatbubble' },
  { name: 'agents',  label: 'Agents',   icon: 'hardware-chip-outline',   iconActive: 'hardware-chip' },
  { name: 'tasks',   label: 'Tasks',    icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle' },
  { name: 'settings',label: 'Settings', icon: 'settings-outline',         iconActive: 'settings' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barOuter, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.bar}>
        {TABS.map((tab, index) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => navigation.navigate(tab.name)}
              android_ripple={{ color: 'transparent' }}
            >
              <View style={[styles.pill, focused && styles.pillActive]}>
                <Ionicons
                  name={focused ? tab.iconActive : tab.icon}
                  size={22}
                  color={focused ? '#fff' : '#64748b'}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agents" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  pill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#6366f1',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#6366f1',
  },
});
