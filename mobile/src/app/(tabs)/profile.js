import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui';
import { api } from '../../lib/api';
import { showAlert } from '../../lib/alert';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { API_URL } from '../../lib/config';
import { colors } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, errorText } = useI18n();
  const unblockAll = () => api.unblockAll()
    .then(() => showAlert(t('unblockAllDone')))
    .catch((err) => showAlert(t('error'), errorText(err)));
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.card}>
        <Text style={s.name}>{user.display_name}</Text>
        <Text style={s.muted}>{user.email}</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>{t(`role_${user.role}`)}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h}>{t('language')}</Text>
        <LanguageSwitch />
      </View>
      <Button title={t('logout')} variant="secondary" onPress={logout} />
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`${API_URL}/privacy`)} style={s.linkRow}>
        <Text style={s.link}>{t('privacyPolicy')}</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`${API_URL}/terms`)} style={s.linkRow}>
        <Text style={s.link}>{t('termsOfUse')}</Text>
      </Pressable>
      {user.role === 'resident' ? (
        <Pressable accessibilityRole="button" onPress={unblockAll} style={s.linkRow}>
          <Text style={s.link}>{t('unblockAll')}</Text>
        </Pressable>
      ) : null}
      {/* Admin accounts are managed in the database, residents can delete theirs here */}
      {user.role === 'resident' ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/delete-account')} style={s.linkRow}>
          <Text style={[s.link, { color: colors.danger }]}>{t('deleteAccount')}</Text>
        </Pressable>
      ) : null}
      {__DEV__ ? <Text style={[s.muted, { marginTop: 16, fontSize: 12 }]}>{t('server')}: {API_URL}</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.text },
  linkRow: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  link: { fontSize: 16, color: colors.primary },
});
