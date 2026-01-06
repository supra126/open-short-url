/**
 * Internationalization (i18n) Utility
 *
 * A lightweight, TypeScript-safe i18n solution without external dependencies.
 * - Loads translations based on NEXT_PUBLIC_LOCALE environment variable
 * - Falls back to English (en) if locale not found
 * - Provides type-safe translation function with autocomplete
 */

import enTranslations from '@/locales/en.json';

// Type definitions for translation keys (auto-generated from en.json)
type Translations = typeof enTranslations;
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<Translations>;

// Import all locale files statically
import zhTWTranslations from '@/locales/zh-TW.json';

// Map of available locales
const localeMap: Record<string, Translations> = {
  'en': enTranslations,
  'zh-TW': zhTWTranslations as Translations,
};

/**
 * Load translations based on environment variable
 * Falls back to English if locale not found
 */
function loadTranslations(): Translations {
  const locale = process.env.NEXT_PUBLIC_LOCALE || 'en';
  const translations = localeMap[locale];

  if (translations) {
    return translations;
  }

  // Fallback to English if locale not found
  console.warn(`Locale "${locale}" not found, falling back to "en"`);
  return enTranslations;
}

// Load translations once at module initialization
const translations = loadTranslations();

/**
 * Get value from nested object using dot notation
 * Example: get(obj, 'auth.loginTitle') returns obj.auth.loginTitle
 */
function getNestedValue(obj: Translations, path: string): string {
  type NestedObject = Record<string, unknown>;
  const result = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as NestedObject)[key];
    }
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : path;
}

/**
 * Translation function with TypeScript autocomplete support and variable interpolation
 *
 * @param key - Translation key in dot notation (e.g., 'auth.loginTitle')
 * @param vars - Optional variables to interpolate in the translation string
 * @returns Translated string with variables replaced
 *
 * @example
 * t('auth.loginTitle') // Returns "Login" or localized equivalent
 * t('common.email')    // Returns "Email" or localized equivalent
 * t('webhooks.currentCount', { count: 5 }) // Returns "Currently have 5 Webhooks"
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  let translation = getNestedValue(translations, key);

  // Replace variables in the format {variableName}
  // Using replaceAll to avoid ReDoS vulnerability from dynamic regex
  if (vars) {
    Object.entries(vars).forEach(([varKey, varValue]) => {
      translation = translation.replaceAll(`{${varKey}}`, String(varValue));
    });
  }

  return translation;
}

/**
 * Get current locale
 */
export function getLocale(): string {
  return process.env.NEXT_PUBLIC_LOCALE || 'en';
}
