// All reports as a list, sorted by likes or by date, with filters (R3, success criterion 3)
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import ReportCard from '../../components/ReportCard';
import { Chip, ErrorBox } from '../../components/ui';
import { useReports } from '../../lib/useReports';
import { useCategories } from '../../lib/useCategories';
import { useLike } from '../../lib/useLike';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { colors, statusColors, STATUSES } from '../../lib/theme';

export default function ListScreen() {
  const { t, category } = useI18n();
  const { user } = useAuth();
  const categories = useCategories();
  const [sort, setSort] = useState('votes');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mine, setMine] = useState(false);
  const { reports, loading, error, reload, updateOne } = useReports({ sort, status, category_id: categoryId, mine: mine ? 1 : '' });
  const { toggle, busyId } = useLike(updateOne);

  const header = (
    <View style={{ paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label={t('topVoted')} active={sort === 'votes'} onPress={() => setSort('votes')} />
        <Chip label={t('newest')} active={sort === 'new'} onPress={() => setSort('new')} />
        <Chip label={t('myReports')} active={mine} onPress={() => setMine(!mine)} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label={t('all')} active={!status} onPress={() => setStatus('')} />
        {STATUSES.map((st) => (
          <Chip key={st} label={t(st)} active={status === st} color={statusColors[st]} onPress={() => setStatus(st)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label={t('allCategories')} active={!categoryId} onPress={() => setCategoryId('')} />
        {categories.map((c) => (
          <Chip key={c.id} label={category(c.name)} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
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
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
      ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 32, fontSize: 16 }}>{t('noReports')}</Text> : null}
      renderItem={({ item }) => (
        <ReportCard
          report={item}
          onPress={() => router.push(`/report/${item.id}`)}
          onLike={item.user_id === user.id ? undefined : () => toggle(item)}
          liking={busyId === item.id}
        />
      )}
    />
  );
}
