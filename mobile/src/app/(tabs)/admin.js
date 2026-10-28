// R7: dashboard for city services. Reports sorted by likes, status changed in one tap.
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Chip, ErrorBox, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useReports } from '../../lib/useReports';
import { showAlert } from '../../lib/alert';
import { colors, statusColors, STATUSES } from '../../lib/theme';

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const { t, category, errorText } = useI18n();
  const [status, setStatus] = useState('under_review');
  const { reports, loading, error, reload, updateOne } = useReports({ status, sort: 'votes' });
  const [stats, setStats] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadStats = useCallback(() => { if (isAdmin) api.stats().then(setStats).catch(() => {}); }, [isAdmin]);
  useFocusEffect(loadStats);

  if (!isAdmin) return <Redirect href="/" />;

  const change = async (report, newStatus) => {
    setBusyId(report.id);
    try {
      await api.setStatus(report.id, newStatus);
      updateOne(report.id, { status: newStatus });
      loadStats();
    } catch (err) {
      showAlert(t('error'), errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  const maxCategory = Math.max(1, ...(stats?.by_category.map((c) => c.count) ?? [1]));
  const count = (st) => stats?.by_status.find((x) => x.status === st)?.count ?? 0;

  const header = (
    <View style={{ paddingTop: 12 }}>
      {stats ? (
        <>
          <View style={s.tiles}>
            <Tile label={t('totalReports')} value={stats.reports} />
            <Tile label={t('totalUsers')} value={stats.users} />
            <Tile label={t('totalVotes')} value={stats.votes} />
          </View>
          <View style={s.tiles}>
            {STATUSES.map((st) => <Tile key={st} label={t(st)} value={count(st)} color={statusColors[st]} />)}
          </View>
          <Text style={s.h}>{t('byCategory')}</Text>
          {stats.by_category.map((c) => (
            <View key={c.name} style={s.catRow}>
              <Text style={s.catName}>{category(c.name)}</Text>
              <View style={s.barTrack}>
                <View style={[s.bar, { width: `${(c.count / maxCategory) * 100}%` }]} />
              </View>
              <Text style={s.catCount}>{c.count}</Text>
            </View>
          ))}
        </>
      ) : null}
      <Text style={s.h}>{t('queue')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {STATUSES.map((st) => (
          <Chip key={st} label={t(st)} active={status === st} color={statusColors[st]} onPress={() => setStatus(st)} />
        ))}
      </ScrollView>
      <ErrorBox message={error} onRetry={reload} />
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
      data={reports}
      keyExtractor={(r) => String(r.id)}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { reload(); loadStats(); }} />}
      ListEmptyComponent={!loading ? <Text style={s.empty}>{t('noReports')}</Text> : null}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cat} onPress={() => router.push(`/report/${item.id}`)}>#{item.id} · {category(item.category)} · ♥ {item.vote_count}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={s.text} onPress={() => router.push(`/report/${item.id}`)}>{item.description}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {STATUSES.filter((st) => st !== item.status).map((st) => (
              <Chip key={st} label={`→ ${t(st)}`} onPress={() => busyId !== item.id && change(item, st)} />
            ))}
          </View>
        </View>
      )}
    />
  );
}

function Tile({ label, value, color }) {
  return (
    <View style={[s.tile, color && { borderTopColor: color, borderTopWidth: 4 }]}>
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tile: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  tileLabel: { fontSize: 12, color: colors.muted },
  h: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 8, color: colors.text },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catName: { width: 130, fontSize: 13, color: colors.text },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
  catCount: { width: 32, textAlign: 'right', fontSize: 13, color: colors.muted },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cat: { fontSize: 13, fontWeight: '700', color: colors.primary, flexShrink: 1, marginRight: 8 },
  text: { fontSize: 16, marginVertical: 8, color: colors.text },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32, fontSize: 16 },
});
