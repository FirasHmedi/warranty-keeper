import { addDays, addMonths, atLocalTime, daysBetween, type ISODate, toISODate } from './dates';

export type WarrantyStatus = 'active' | 'soon' | 'expired';

/** An item "ends soon" when its warranty ends in this many days or fewer. */
export const SOON_DAYS = 30;
export const MONTH_PRESETS = [12, 24, 36] as const;
export const MAX_MONTHS = 600;

/** Warranty end date: purchase date plus the warranty length, end-of-month clamped. */
export function warrantyEndDate(purchaseDate: ISODate, months: number): ISODate {
  return addMonths(purchaseDate, months);
}

/** Days left until the end date, counted from `today`. 0 = ends today, negative = expired. */
export function daysRemaining(endDate: ISODate, today: ISODate): number {
  return daysBetween(today, endDate);
}

/** The warranty still covers the end date itself, so it is only expired the day after. */
export function warrantyStatus(endDate: ISODate, today: ISODate, soonDays = SOON_DAYS): WarrantyStatus {
  const days = daysRemaining(endDate, today);
  if (days < 0) return 'expired';
  if (days <= soonDays) return 'soon';
  return 'active';
}

export type ReminderKind = 'before' | 'end';

export interface Reminder {
  kind: ReminderKind;
  date: ISODate;
  at: Date;
}

/** Hour of the day (local time) at which reminders fire. */
export const REMINDER_HOUR = 9;

/**
 * Reminders for an end date: 30 days before, and on the end date itself, at 09:00 local time.
 * Only reminders still in the future relative to `now` are returned.
 */
export function reminderSchedule(endDate: ISODate, now: Date, soonDays = SOON_DAYS): Reminder[] {
  const candidates: { kind: ReminderKind; date: ISODate }[] = [
    { kind: 'before', date: addDays(endDate, -soonDays) },
    { kind: 'end', date: endDate },
  ];
  return candidates
    .map((c) => ({ ...c, at: atLocalTime(c.date, REMINDER_HOUR) }))
    .filter((r) => r.at.getTime() > now.getTime());
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function isValidMonths(months: number): boolean {
  return Number.isInteger(months) && months >= 1 && months <= MAX_MONTHS;
}
