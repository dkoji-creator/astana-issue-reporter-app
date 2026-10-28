// One report in a list: category, text, status, likes
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { StatusBadge } from './ui';

export default function ReportCard({ report, onPress, onLike, liking }) {
  const { t, category, date } = useI18n();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={s.row}>
        <Text style={s.category}>{category(report.category)}</Text>
        <StatusBadge status={report.status} />
      </View>
      <Text style={s.text} numberOfLines={2}>{report.description}</Text>
      <View style={s.row}>
        <Text style={s.meta}>#{report.id} · {date(report.created_at)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('like')}
          onPress={onLike}
          disabled={!onLike || liking}
          hitSlop={8}
          style={s.like}
        >
          <Ionicons name={report.voted_by_me ? 'heart' : 'heart-outline'} size={22} color={colors.like} />
          <Text style={s.likeText}>{report.vote_count}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 13, fontWeight: '700', color: colors.primary, flexShrink: 1, marginRight: 8 },
  text: { fontSize: 16, color: colors.text, marginVertical: 8 },
  meta: { fontSize: 13, color: colors.muted },
  like: { flexDirection: 'row', alignItems: 'center', minHeight: 44, minWidth: 44, justifyContent: 'flex-end' },
  likeText: { marginLeft: 4, fontSize: 15, fontWeight: '600', color: colors.text },
});
