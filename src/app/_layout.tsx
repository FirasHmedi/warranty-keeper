import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { t } from '../i18n';
import { setupNotificationHandler } from '../services/reminders';
import { useTheme } from '../theme';
import { refreshWidgets } from '../widget/update';

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();
  useEffect(() => {
    setupNotificationHandler();
    // Days left change every day: redraw the home-screen widget whenever the app opens.
    refreshWidgets();
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
