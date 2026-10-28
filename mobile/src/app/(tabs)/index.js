// Main screen: the map of Astana with all reports (R1, R6, R10)
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import { Chip, ErrorBox, StatusBadge } from '../../components/ui';
import { useReports } from '../../lib/useReports';
import { useI18n } from '../../lib/i18n';
import { colors, statusColors, STATUSES } from '../../lib/theme';

export default function MapScreen() {
  const { t, category } = useI18n();
  const [status, setStatus] = useState('');
  const { reports, error, reload } = useReports({ status });
  const [selectedId, setSelectedId] = useState(null);
  const selected = reports.find((r) => r.id === selectedId);

  return (
    <View style={{ flex: 1 }}>
      <LeafletMap markers={reports} onMarkerPress={setSelectedId} onMapTap={() => setSelectedId(null)} />

      {/* Status filter; the colours are the same as the markers */}
      <SafeAreaView edges={['top']} style={s.top} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          <Chip label={`${t('all')}`} active={!status} onPress={() => setStatus('')} />
          {STATUSES.map((st) => (
            <Chip key={st} label={t(st)} active={status === st} color={statusColors[st]} onPress={() => setStatus(st)} />
          ))}
        </ScrollView>
        <ErrorBox message={error} onRetry={reload} />
      </SafeAreaView>

      {selected ? (
        <Pressable style={s.card} onPress={() => router.push(`/report/${selected.id}`)}>
          <View style={s.row}>
            <Text style={s.category}>{category(selected.category)}</Text>
            <StatusBadge status={selected.status} />
          </View>
          <Text style={s.text} numberOfLines={2}>{selected.description}</Text>
          <View style={s.row}>
            <Text style={s.muted}>♥ {selected.vote_count}</Text>
            <Text style={s.open}>{t('open')} ›</Text>
          </View>
        </Pressable>
      ) : null}

      {/* R9: one tap opens the camera for a new report */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newReport')}
        style={s.fab}
        onPress={() => router.push('/report/new?camera=1')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 8 },
  card: {
    position: 'absolute', left: 12, right: 84, bottom: 16, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 13, fontWeight: '700', color: colors.primary, flexShrink: 1, marginRight: 8 },
  text: { fontSize: 16, marginVertical: 6, color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  open: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute', right: 16, bottom: 16, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },
});
