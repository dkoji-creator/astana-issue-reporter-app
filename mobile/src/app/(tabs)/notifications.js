// R8: status-change notifications for the author
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '../../components/ui';
import { useNotifications } from '../../lib/notifications';
import { useI18n } from '../../lib/i18n';
import { colors } from '../../lib/theme';

export default function NotificationsScreen() {
  const { items, unread, refresh, markAllRead } = useNotifications();
  const { t, notificationText, date } = useI18n();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 12 }}
      data={items}
      keyExtractor={(n) => String(n.id)}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
      ListHeaderComponent={unread > 0
        ? <Button title={t('markAllRead')} variant="secondary" onPress={() => markAllRead().catch(() => {})} style={{ marginBottom: 12 }} />
        : null}
      ListEmptyComponent={<Text style={s.empty}>{t('noNotifications')}</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={[s.item, !item.is_read && s.unread]}
          onPress={() => item.report_id && router.push(`/report/${item.report_id}`)}
        >
          {!item.is_read ? <View style={s.dot} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.text}>{notificationText(item)}</Text>
            <Text style={s.date}>{date(item.created_at, true)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: colors.border, minHeight: 56,
  },
  unread: { borderColor: colors.primary, backgroundColor: '#F5F8FF' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginRight: 10 },
  text: { fontSize: 16, color: colors.text },
  date: { fontSize: 13, color: colors.muted, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32, fontSize: 16 },
});
