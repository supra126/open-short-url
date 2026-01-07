/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLocale } from './i18n';
import { ErrorHandler } from './error-handler';

/**
 * Merge Tailwind CSS class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get browser locale or fallback to app locale
 * Maps locale codes to Intl-compatible format
 */
function getBrowserLocale(): string {
  const appLocale = getLocale();

  // Map locale codes to Intl-compatible format
  const localeMap: Record<string, string> = {
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
    'en': 'en-US',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
  };

  return localeMap[appLocale] || appLocale || 'en-US';
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(getBrowserLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format date and time (24-hour format)
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(getBrowserLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Format short date (month and day only)
 */
export function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(getBrowserLocale(), {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format time only (24-hour format)
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(getBrowserLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    ErrorHandler.log(error, 'Copy to Clipboard');
    return false;
  }
}

/**
 * Format number (add thousand separators)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat(getBrowserLocale()).format(num);
}

/**
 * Truncate URL display
 */
export function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

/**
 * Build URL query string from params object
 * Filters out undefined and null values
 */
export function buildQueryParams<T extends object>(params: T): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}
