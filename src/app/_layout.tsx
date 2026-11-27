import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { t } from '../i18n';
import { setupNotificationHandler } from '../services/reminders';
import { useTheme } from '../theme';

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();
  useEffect(() => {
    setupNotificationHandler();
  }, []);
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: t('appTitle') }} />
        <Stack.Screen name="item/[id]" options={{ title: t('details') }} />
        <Stack.Screen name="edit" options={{ title: t('newItem') }} />
      </Stack>
    </>
  );
}
