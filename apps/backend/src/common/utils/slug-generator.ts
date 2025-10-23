import { nanoid, customAlphabet } from 'nanoid';

/**
 * Generate a random slug using nanoid
 * @param length - Length of the slug (default: 8)
 * @returns Random slug
 */
export function generateSlug(length: number = 8): string {
  return nanoid(length);
}

/**
 * Generate a custom slug with specific alphabet
 * Excludes similar looking characters (0, O, I, l, etc.)
 * @param length - Length of the slug (default: 8)
 * @returns Custom slug
 */
export function generateCustomSlug(length: number = 8): string {
  const alphabet =
    '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const customNanoid = customAlphabet(alphabet, length);
  return customNanoid();
}

/**
 * Validate slug format
 * - Only alphanumeric characters, hyphens, and underscores
 * - Length between 3-50 characters
 * @param slug - Slug to validate
 * @returns True if valid
 */
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return slugRegex.test(slug);
}

/**
 * Normalize slug
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * @param slug - Slug to normalize
 * @returns Normalized slug
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');
}
