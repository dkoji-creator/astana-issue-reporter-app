import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { colors } from '../lib/theme';
import { API_URL } from '../lib/config';
import { Button, ErrorBox, Field } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t, errorText } = useI18n();
  const [form, setForm] = useState({ display_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false); // app stores require accepting the content rules
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // Same rules as the server, checked before sending
  const problems = {
    display_name: form.display_name.trim().length >= 2 ? '' : '2–60',
    email: EMAIL_RE.test(form.email.trim()) ? '' : 'name@example.kz',
    password: form.password.length >= 8 ? '' : '8+',
  };
  const valid = !problems.display_name && !problems.email && !problems.password && agreed;

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await register({ ...form, email: form.email.trim(), display_name: form.display_name.trim() });
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Field label={`${t('name')} (2–60)`} value={form.display_name} onChangeText={set('display_name')} maxLength={60} />
      <Field label={t('email')} value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Field label={`${t('password')} (8+)`} value={form.password} onChangeText={set('password')} secureTextEntry />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed((a) => !a)} style={s.agree}>
        <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
        <Text style={s.agreeText}>{t('agreeTerms')}</Text>
      </Pressable>
      <View style={s.docs}>
        <Text accessibilityRole="link" onPress={() => Linking.openURL(`${API_URL}/terms`)} style={s.docLink}>{t('termsOfUse')}</Text>
        <Text accessibilityRole="link" onPress={() => Linking.openURL(`${API_URL}/privacy`)} style={s.docLink}>{t('privacyPolicy')}</Text>
      </View>
      <ErrorBox message={error} />
      <Button title={t('register')} onPress={submit} loading={busy} disabled={!valid} />
      <Link href="/login" style={s.link}>{t('haveAccount')}</Link>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  link: { color: colors.primary, fontSize: 16, textAlign: 'center', marginTop: 18, padding: 8 },
  agree: { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 4 },
  agreeText: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.text },
  docs: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
  docLink: { color: colors.primary, fontSize: 14, paddingVertical: 6, textDecorationLine: 'underline' },
});
