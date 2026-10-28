// Report details: photo, description, place, status badge (R6), likes (R3), history,
// and for admins the status change (R7)
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import { Chip, ErrorBox, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useLike } from '../../lib/useLike';
import { showAlert } from '../../lib/alert';
import { colors, statusColors, STATUSES } from '../../lib/theme';

export default function ReportScreen() {
  const { id } = useLocalSearchParams();
  const { user, isAdmin } = useAuth();
  const { t, category, errorText, date } = useI18n();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);
  const { toggle, busyId } = useLike((_, res) => setReport((r) => ({ ...r, ...res })));

  const load = useCallback(async () => {
    try {
      setReport(await api.report(id));
      setError('');
    } catch (err) {
      setError(errorText(err));
    }
  }, [id, errorText]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeStatus = async (status) => {
    setChanging(true);
    try {
      await api.setStatus(report.id, status);
      await load();
      showAlert(t('statusChanged'));
    } catch (err) {
      showAlert(t('error'), errorText(err));
    } finally {
      setChanging(false);
    }
  };

  // Same object between renders, so a like does not re-centre the map
  const lat = report?.lat;
  const lng = report?.lng;
  const status = report?.status;
  const mapPin = useMemo(() => (lat ? { lat, lng, pan: true } : null), [lat, lng]);
  const mapMarkers = useMemo(() => (lat ? [{ id: Number(id), lat, lng, status }] : []), [id, lat, lng, status]);

  if (!report) {
    return (
      <View style={{ padding: 16 }}>
        <Stack.Screen options={{ title: `#${id}` }} />
        {error ? <ErrorBox message={error} onRetry={load} /> : <ActivityIndicator color={colors.primary} />}
      </View>
    );
  }

  const own = report.user_id === user.id;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Stack.Screen options={{ title: `#${report.id}` }} />
      {report.photo_url
        ? <Image source={{ uri: report.photo_url }} style={s.photo} resizeMode="cover" accessibilityLabel={t('photo')} />
        : <View style={[s.photo, s.noPhoto]}><Ionicons name="image-outline" size={40} color={colors.muted} /><Text style={{ color: colors.muted }}>{t('noPhoto')}</Text></View>}

      <View style={s.row}>
        <Text style={s.category}>{category(report.category)}</Text>
        <StatusBadge status={report.status} />
      </View>
      <Text style={s.text}>{report.description}</Text>
      <Text style={s.muted}>{t('reportedBy', { name: report.author_name })} · {date(report.created_at, true)}</Text>

      <Pressable
        accessibilityRole="button"
        disabled={own || busyId === report.id}
        onPress={() => toggle(report)}
        style={[s.like, report.voted_by_me && s.liked, own && { opacity: 0.5 }]}
      >
        <Ionicons name={report.voted_by_me ? 'heart' : 'heart-outline'} size={24} color={colors.like} />
        <Text style={s.likeText}>
          {report.voted_by_me ? t('liked') : t('like')} · {report.vote_count}
        </Text>
      </Pressable>

      {isAdmin ? (
        <View style={s.box}>
          <Text style={s.h}>{t('changeStatus')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {STATUSES.map((st) => (
              <Chip key={st} label={t(st)} active={report.status === st} color={statusColors[st]}
                onPress={() => !changing && report.status !== st && changeStatus(st)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={s.map}>
        <LeafletMap markers={mapMarkers} pin={mapPin} />
      </View>
      <Text style={s.muted}>{report.lat.toFixed(5)}, {report.lng.toFixed(5)}</Text>

      <View style={s.box}>
        <Text style={s.h}>{t('history')}</Text>
        {report.history.length === 0 ? <Text style={s.muted}>{t('noHistory')}</Text> : null}
        {report.history.map((h, i) => (
          <Text key={i} style={s.historyRow}>
            {date(h.changed_at)}: {t(h.old_status || 'under_review')} → {t(h.new_status)} ({h.changed_by})
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: colors.border, marginBottom: 14 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 15, fontWeight: '700', color: colors.primary, flexShrink: 1, marginRight: 8 },
  text: { fontSize: 17, color: colors.text, marginVertical: 10, lineHeight: 24 },
  muted: { fontSize: 14, color: colors.muted },
  like: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: 12,
    borderWidth: 1, borderColor: colors.like, marginTop: 14,
  },
  liked: { backgroundColor: '#FEF2F2' },
  likeText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: colors.like },
  box: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.text },
  map: { height: 200, borderRadius: 14, overflow: 'hidden', marginTop: 14, marginBottom: 6 },
  historyRow: { fontSize: 14, color: colors.text, marginBottom: 4 },
});
