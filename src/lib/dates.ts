/**
 * Calendar-date helpers. Dates are plain `YYYY-MM-DD` strings (no time, no time zone)
 * so that a warranty end date never shifts when the phone changes time zone.
 */
export type ISODate = string;

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Parses a `YYYY-MM-DD` string. Returns null for anything that is not a real calendar date. */
export function parseISODate(value: string): DateParts | null {
  const m = ISO_RE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

export function formatISODate({ year, month, day }: DateParts): ISODate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function mustParse(value: ISODate): DateParts {
  const parts = parseISODate(value);
  if (!parts) throw new Error(`Invalid date: ${value}`);
  return parts;
}

/**
 * Adds whole months. When the target month is shorter, the day is clamped to its last day:
 * 2024-01-31 + 1 month = 2024-02-29, 2024-02-29 + 12 months = 2025-02-28.
 */
export function addMonths(date: ISODate, months: number): ISODate {
  if (!Number.isInteger(months)) throw new Error(`Months must be an integer: ${months}`);
  const { year, month, day } = mustParse(date);
  const index = year * 12 + (month - 1) + months;
  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12) + 1;
  return formatISODate({
    year: newYear,
    month: newMonth,
    day: Math.min(day, daysInMonth(newYear, newMonth)),
  });
}

function toUTC(date: ISODate): number {
  const { year, month, day } = mustParse(date);
  return Date.UTC(year, month - 1, day);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = new Date(toUTC(date) + days * DAY_MS);
  return formatISODate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

/** Number of calendar days from `from` to `to` (negative when `to` is before `from`). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

/** Local calendar date of a JS Date (the phone's own day, not UTC). */
export function toISODate(date: Date): ISODate {
  return formatISODate({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
}

/** Local Date at the given hour on a calendar date. */
export function atLocalTime(date: ISODate, hour: number, minute = 0): Date {
  const { year, month, day } = mustParse(date);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}
