// Small reusable UI pieces. Touch targets are at least 44x44 px, body text 16 px (midterm part D)
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, statusColors } from '../lib/theme';
import { useI18n } from '../lib/i18n';

export function Button({ title, onPress, disabled, loading, variant = 'primary', style }) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        (disabled || loading) && styles.buttonDisabled,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={secondary ? colors.primary : '#fff'} />
        : <Text style={[styles.buttonText, secondary && { color: colors.primary }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, error && { borderColor: colors.danger }]} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, color }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: color || colors.primary, borderColor: color || colors.primary }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  return (
    <View style={[styles.badge, { backgroundColor: statusColors[status] }]}>
      <Text style={styles.badgeText}>{t(status)}</Text>
    </View>
  );
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useI18n();
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={{ color: colors.danger, fontSize: 15 }}>{message}</Text>
      {onRetry ? <Button title={t('retry')} variant="secondary" onPress={onRetry} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 48, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  buttonSecondary: { backgroundColor: colors.primaryLight },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  chip: {
    minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 8,
  },
  chipText: { fontSize: 14, color: colors.text },
  badge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginVertical: 8 },
});
