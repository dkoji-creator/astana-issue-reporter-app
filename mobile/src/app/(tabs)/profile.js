import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { API_URL } from '../../lib/config';
import { colors } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
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
      <Text style={[s.muted, { marginTop: 16, fontSize: 12 }]}>{t('server')}: {API_URL}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.text },
});
