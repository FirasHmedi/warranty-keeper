import { repository } from '../data/repository';
import { notifyChanged } from '../data/store';
import type { Item } from '../data/types';
import { deleteReceipt } from './receipts';
import { cancelReminders, scheduleReminders } from './reminders';
import { refreshWidgets } from '../widget/update';

/**
 * Saves an item and keeps its notifications in sync: old reminders are always cancelled,
 * new ones are scheduled only when reminders are on. Also removes a replaced receipt photo.
 */
export async function saveItem(item: Item, previous: Item | null): Promise<void> {
  if (previous) await cancelReminders(previous.notificationIds);
  const notificationIds = item.remindersEnabled ? await scheduleReminders(item) : [];
  const now = Date.now();
  await repository.upsert({ ...item, notificationIds, createdAt: item.createdAt || now, updatedAt: now });
  if (previous?.receiptUri && previous.receiptUri !== item.receiptUri) deleteReceipt(previous.receiptUri);
  notifyChanged();
  refreshWidgets();
}

export async function deleteItem(item: Item): Promise<void> {
  await cancelReminders(item.notificationIds);
  await repository.remove(item.id);
  deleteReceipt(item.receiptUri);
  notifyChanged();
  refreshWidgets();
}
