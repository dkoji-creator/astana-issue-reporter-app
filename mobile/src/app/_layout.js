// Root of the app: language, login state, notifications, and which screens are allowed
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider, useI18n } from '../lib/i18n';
import { AuthProvider, useAuth } from '../lib/auth';
import { NotificationsProvider } from '../lib/notifications';
import { colors } from '../lib/theme';

function RootStack() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTintColor: colors.primary, contentStyle: { backgroundColor: colors.bg } }}>
      {/* Not logged in: only login and registration are reachable */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: t('register') }} />
      </Stack.Protected>
      {/* Logged in: the main app */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="report/new" options={{ title: t('newReport'), presentation: 'modal' }} />
        <Stack.Screen name="report/[id]" options={{ title: '' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationsProvider>
            <StatusBar style="dark" />
            <RootStack />
          </NotificationsProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
