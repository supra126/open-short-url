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

/**
 * Load translations based on environment variable
 * Falls back to English if locale not found
 */
function loadTranslations(): Translations {
  const locale = process.env.NEXT_PUBLIC_LOCALE || 'en';

  try {
    // Dynamically import the locale file
    const translations = require(`@/locales/${locale}.json`);
    return translations;
  } catch (error) {
    // Fallback to English if locale file not found
    console.warn(`Locale "${locale}" not found, falling back to "en"`);
    return enTranslations;
  }
}

// Load translations once at module initialization
const translations = loadTranslations();

/**
 * Get value from nested object using dot notation
 * Example: get(obj, 'auth.loginTitle') returns obj.auth.loginTitle
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? path;
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
 * t('webhooks.currentCount', { count: 5 }) // Returns "目前有 5 個 Webhook"
 */
export function t(key: TranslationKey, vars?: Record<string, any>): string {
  let translation = getNestedValue(translations, key);

  // Replace variables in the format {variableName}
  if (vars) {
    Object.entries(vars).forEach(([varKey, varValue]) => {
      translation = translation.replace(
        new RegExp(`\\{${varKey}\\}`, 'g'),
        String(varValue)
      );
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
