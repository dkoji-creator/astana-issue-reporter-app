// Report details: photo, description, place, status badge (R6), likes (R3), history,
// and for admins the status change (R7). Moderation (app store rule for user content):
// residents can report the content or block the author, admins delete the report or dismiss complaints
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import { Button, Chip, ErrorBox, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useLike } from '../../lib/useLike';
import { showAlert, showConfirm } from '../../lib/alert';
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

  // Runs a moderation action after the user confirms, then leaves the screen
  const moderate = async (question, action, doneText) => {
    if (!(await showConfirm(question.title, question.message, t('confirm'), t('cancel')))) return;
    setChanging(true);
    try {
      await action();
      showAlert(doneText);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (err) {
      showAlert(t('error'), errorText(err));
      setChanging(false);
    }
  };

  const dismissFlags = async () => {
    setChanging(true);
    try {
      await api.dismissFlags(report.id);
      await load();
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
        <View style={[s.box, report.flag_count > 0 && { borderColor: colors.danger }]}>
          {report.flag_count > 0 ? (
            <>
              <Text style={[s.h, { color: colors.danger }]}>{t('complaintsCount', { count: report.flag_count })}</Text>
              <Button title={t('keepReport')} variant="secondary" onPress={dismissFlags} disabled={changing} style={{ marginBottom: 8 }} />
            </>
          ) : null}
          <Button
            title={t('deleteReport')}
            variant="danger"
            disabled={changing}
            onPress={() => moderate({ title: t('deleteReport'), message: t('deleteReportAsk') }, () => api.deleteReport(report.id), t('reportDeleted'))}
          />
        </View>
      ) : null}

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

      {!own && !isAdmin ? (
        <View style={s.moderation}>
          <Pressable
            accessibilityRole="button"
            disabled={changing}
            style={s.modButton}
            onPress={() => moderate({ title: t('reportContent'), message: t('reportContentAsk') }, () => api.flag(report.id), t('reportContentDone'))}
          >
            <Ionicons name="flag-outline" size={18} color={colors.danger} />
            <Text style={s.modText}>{t('reportContent')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={changing}
            style={s.modButton}
            onPress={() => moderate({ title: t('blockAuthor'), message: t('blockAuthorAsk', { name: report.author_name }) }, () => api.blockUser(report.user_id), t('blockAuthorDone'))}
          >
            <Ionicons name="person-remove-outline" size={18} color={colors.danger} />
            <Text style={s.modText}>{t('blockAuthor')}</Text>
          </Pressable>
        </View>
      ) : null}
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
  moderation: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 },
  modButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 12 },
  modText: { marginLeft: 6, fontSize: 15, color: colors.danger },
});
