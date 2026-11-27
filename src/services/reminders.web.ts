// Web preview only: local notifications are not available.
export function setupNotificationHandler() {}

export async function ensureNotificationPermission(): Promise<boolean> {
  return true;
}

export async function cancelReminders(_ids: readonly string[]): Promise<void> {}

export async function scheduleReminders(_item: { id: string; name: string; endDate: string }): Promise<string[]> {
  return [];
}
