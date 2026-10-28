import { Tabs } from 'expo-router/tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useNotifications } from '../../lib/notifications';
import { colors } from '../../lib/theme';


export default function TabsLayout() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const { unread } = useNotifications();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerTintColor: colors.text }}>
      <Tabs.Screen name="index" options={{ title: t('tabMap'), headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} /> }} />
      <Tabs.Screen name="list" options={{ title: t('tabList'), tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} /> }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabNotifications'),
          headerTitle: t('notifications'),
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} />,
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      {/* R7: the admin dashboard tab exists only for admins */}
      <Tabs.Screen
        name="admin"
        options={{ title: t('tabAdmin'), headerTitle: t('dashboard'), tabBarIcon: ({ color, size }) => <Ionicons name="construct" color={color} size={size} />, href: isAdmin ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: t('tabProfile'), tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}
