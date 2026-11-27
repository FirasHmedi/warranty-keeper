/**
 * Parses a user-typed price: "12", "12.5", "12,50", "1 299,90". Returns null when empty,
 * undefined when invalid. Result is rounded to cents.
 */
export function parsePrice(input: string): number | null | undefined {
  const cleaned = input.replace(/[\s  ]/g, '').replace(',', '.');
  if (cleaned === '') return null;
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return undefined;
  return Math.round(Number(cleaned) * 100) / 100;
}

/** Plain number formatting, no currency symbol (the app does not know which currency was used). */
export function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Positive whole number of months from text, or null. */
export function parseMonths(input: string): number | null {
  const cleaned = input.trim();
  if (!/^\d{1,3}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 1 ? n : null;
}
