import { getLocales } from 'expo-localization';

import en, { type TranslationKey } from './en';
import fr from './fr';

export type Language = 'fr' | 'en';

function detectLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

export const language: Language = detectLanguage();
export const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
const strings = language === 'fr' ? fr : en;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text = strings[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
  }
  return text;
}

/** Long, readable date in the phone's language, e.g. "27 novembre 2026" / "27 November 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
}
