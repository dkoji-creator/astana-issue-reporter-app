// R8: the author learns about a status change.
// The app asks the server for new notifications every 30 s and when it comes back to the screen.
// A new one is shown as a phone notification (local notification, works in Expo Go)
// and in the Alerts tab with a red badge.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { api } from './api';
import { useAuth } from './auth';
import { useI18n } from './i18n';

const POLL_MS = 30000;
const NotificationsContext = createContext(null);

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function showPhoneNotification(title, body, reportId) {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('status', {
        name: 'Report status',
        // eslint-disable-next-line import/namespace -- exported at runtime, the lint resolver misses it
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { reportId } },
      trigger: Platform.OS === 'android' ? { channelId: 'status' } : null,
    });
  } catch (err) {
    console.warn('Local notification failed', err);
  }
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { notificationText } = useI18n();
  const textRef = useRef(notificationText);
  useEffect(() => { textRef.current = notificationText; }, [notificationText]);
  // Data is tagged with the user it belongs to, so after logout/login nothing old is shown
  const [data, setData] = useState({ userId: null, items: [], unread: 0 });
  const mine = data.userId === user?.id;
  const items = useMemo(() => (mine ? data.items : []), [mine, data.items]);
  const unread = mine ? data.unread : 0;
  const lastSeenId = useRef(null); // newest id we already know about

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.notifications();
      const newest = data.items[0]?.id ?? 0;
      if (lastSeenId.current !== null) {
        const fresh = data.items.filter((n) => n.id > lastSeenId.current && !n.is_read);
        // Several at once: show only the latest, the rest are in the Alerts tab
        if (fresh.length) showPhoneNotification('Astana Issue Reporter', textRef.current(fresh[0]), fresh[0].report_id);
      }
      lastSeenId.current = Math.max(newest, lastSeenId.current ?? 0);
      setData({ userId: user.id, items: data.items, unread: data.unread });
    } catch {
      // Offline: try again on the next tick
    }
  }, [user]);

  useEffect(() => {
    lastSeenId.current = null;
    if (!user) return undefined;
    if (Platform.OS !== 'web') Notifications.requestPermissionsAsync().catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set only after the network answer
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [user, refresh]);

  // Tapping a phone notification opens that report
  useEffect(() => {
    if (Platform.OS === 'web' || !user) return undefined;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const reportId = response.notification.request.content.data?.reportId;
      if (reportId) router.push(`/report/${reportId}`);
    });
    return () => sub.remove();
  }, [user]);

  const markAllRead = useCallback(async () => {
    await api.readAllNotifications();
    setData((d) => ({ ...d, unread: 0, items: d.items.map((n) => ({ ...n, is_read: true })) }));
  }, []);

  const value = useMemo(() => ({ items, unread, refresh, markAllRead }), [items, unread, refresh, markAllRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
