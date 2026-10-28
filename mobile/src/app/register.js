import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { colors } from '../lib/theme';
import { Button, ErrorBox, Field } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t, errorText } = useI18n();
  const [form, setForm] = useState({ display_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // Same rules as the server, checked before sending
  const problems = {
    display_name: form.display_name.trim().length >= 2 ? '' : '2–60',
    email: EMAIL_RE.test(form.email.trim()) ? '' : 'name@example.kz',
    password: form.password.length >= 8 ? '' : '8+',
  };
  const valid = !problems.display_name && !problems.email && !problems.password;

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
      <ErrorBox message={error} />
      <Button title={t('register')} onPress={submit} loading={busy} disabled={!valid} />
      <Link href="/login" style={s.link}>{t('haveAccount')}</Link>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  link: { color: colors.primary, fontSize: 16, textAlign: 'center', marginTop: 18, padding: 8 },
});
