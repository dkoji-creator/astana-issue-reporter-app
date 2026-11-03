import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { colors } from '../lib/theme';
import { Button, ErrorBox, Field } from '../components/ui';
import LanguageSwitch from '../components/LanguageSwitch';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t, errorText } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  // If logging in takes long, the cloud server is probably waking up: tell the user
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => { clearTimeout(timer); setSlow(false); };
  }, [busy]);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await login(email, password); // on success the layout switches to the main app
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.logo}><Ionicons name="location" size={40} color="#fff" /></View>
          <Text style={s.title}>{t('appName')}</Text>
          <Text style={s.tagline}>{t('tagline')}</Text>

          <Field label={t('email')} value={email} onChangeText={setEmail} autoCapitalize="none"
            keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry
            autoComplete="password" onSubmitEditing={submit} />
          <ErrorBox message={error} />
          <Button title={t('login')} onPress={submit} loading={busy} disabled={!email || !password} />
          {slow ? <Text style={s.hint}>{t('wakingUp')}</Text> : null}

          <Link href="/register" style={s.link}>{t('noAccount')}</Link>
          {/* Test accounts are shown only in development (Expo Go with the laptop), not in the store version */}
          {__DEV__ ? <Text style={s.hint}>{t('demoHint')}</Text> : null}
          <View style={{ marginTop: 24 }}><LanguageSwitch /></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: colors.text },
  tagline: { fontSize: 16, textAlign: 'center', color: colors.muted, marginTop: 6, marginBottom: 28 },
  link: { color: colors.primary, fontSize: 16, textAlign: 'center', marginTop: 18, padding: 8 },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
