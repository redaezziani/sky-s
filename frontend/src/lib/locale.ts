// src/lib/locale.ts
export type Locale = 'en' | 'es' | 'fr' | 'ar';
export const DEFAULT_LOCALE: Locale = 'es';

// Import message files
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';
import frMessages from '../../messages/fr.json';
import arMessages from '../../messages/ar.json';

const messages = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  ar: arMessages,
} as const;

export type Messages = typeof enMessages;

export function getMessages(locale: Locale): Messages {
  // @ts-expect-error - TypeScript cannot infer that messages[locale] matches Messages type
  return messages[locale] || messages[DEFAULT_LOCALE];
}
