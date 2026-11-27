import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { formatDate, t } from '../i18n';
import { reminderSchedule } from '../lib/warranty';

const CHANNEL_ID = 'warranty-reminders';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission only when needed (when the user turns reminders on). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('notifChannel'),
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelReminders(ids: readonly string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}

/** Schedules local notifications (no push) and returns their ids. */
export async function scheduleReminders(item: { id: string; name: string; endDate: string }): Promise<string[]> {
  const ids: string[] = [];
  for (const r of reminderSchedule(item.endDate, new Date())) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: r.kind === 'before' ? t('notifBeforeTitle') : t('notifEndTitle'),
        body:
          r.kind === 'before'
            ? t('notifBeforeBody', { name: item.name, date: formatDate(item.endDate) })
            : t('notifEndBody', { name: item.name }),
        data: { itemId: item.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
    ids.push(id);
  }
  return ids;
}
