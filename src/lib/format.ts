/**
 * Parses a user-typed price: "12", "12.5", "12,50", "1 299,90", "1,299.90", "1.299,90".
 * When both "," and "." appear, the last one is the decimal separator and the other one
 * groups thousands. A single separator is decimal. Returns null when empty, undefined when
 * invalid. Result is rounded to cents.
 */
export function parsePrice(input: string): number | null | undefined {
  let cleaned = input.replace(/[\s  ']/g, '');
  if (cleaned === '') return null;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    const group = lastComma > lastDot ? '.' : ',';
    const intPart = cleaned.slice(0, Math.max(lastComma, lastDot));
    if (!/^\d{1,3}([.,]\d{3})*$/.test(intPart) || intPart.includes(group === '.' ? ',' : '.')) return undefined;
    cleaned = cleaned.split(group).join('');
  }
  cleaned = cleaned.replace(',', '.');
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return undefined;
  return Math.round(Number(cleaned) * 100) / 100;
}

/** Plain number formatting, no currency symbol (the app does not know which currency was used). */
export function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Decimal separator of a locale: "," for fr-FR, "." for en-GB. */
export function decimalSeparator(locale: string): string {
  return formatPrice(1.5, locale).replace(/\d/g, '') || '.';
}

/** A stored price as editable text, without thousands separators: 1299.9 -> "1299,90" (fr) / "1299.90" (en). */
export function priceToInput(value: number, locale: string): string {
  return value.toFixed(2).replace('.', decimalSeparator(locale));
}

/** Positive whole number of months from text, or null. */
export function parseMonths(input: string): number | null {
  const cleaned = input.trim();
  if (!/^\d{1,3}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 1 ? n : null;
}
