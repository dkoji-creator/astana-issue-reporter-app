// Account deletion, required by Google Play and the App Store for apps with registration.
// The server removes the account with its reports, photos, likes and notifications.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBox, Field } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { showAlert } from '../lib/alert';
import { colors } from '../lib/theme';

export default function DeleteAccountScreen() {
  const { user, logout } = useAuth();
  const { t, errorText } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await api.deleteAccount(password);
      showAlert(t('accountDeleted'));
      await logout(); // the login screen opens by itself
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.text}>{t('deleteAccountInfo')}</Text>
      </View>
      <Field label={t('deleteAccountConfirm')} value={password} onChangeText={setPassword} secureTextEntry autoFocus />
      <ErrorBox message={error} />
      <Button title={t('deleteAccountButton')} variant="danger" onPress={submit} loading={busy} disabled={!password} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  email: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
