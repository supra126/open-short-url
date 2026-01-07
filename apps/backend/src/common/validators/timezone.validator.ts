import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * List of valid IANA timezone identifiers
 * This is a subset of commonly used timezones for performance
 * Full list available at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 */
const COMMON_TIMEZONES = new Set([
  // UTC
  'UTC',
  'GMT',
  // Africa
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  // America
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  // Asia
  'Asia/Bangkok',
  'Asia/Chongqing',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Qatar',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tokyo',
  // Australia
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  // Europe
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
]);

/**
 * IANA timezone format regex pattern
 * Matches patterns like: Area/Location, Area/Location/SubLocation
 * Examples: Asia/Taipei, America/New_York, Europe/London
 */
const IANA_TIMEZONE_REGEX = /^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$/;

/**
 * Validates if a string is a valid IANA timezone identifier
 * Uses multiple validation strategies:
 * 1. Check against common timezones list (fast)
 * 2. Validate format with regex
 * 3. Try to use with Intl.DateTimeFormat (definitive but slower)
 */
function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }

  const trimmed = timezone.trim();

  // Quick check: common timezones
  if (COMMON_TIMEZONES.has(trimmed)) {
    return true;
  }

  // Allow UTC without slash
  if (trimmed === 'UTC' || trimmed === 'GMT') {
    return true;
  }

  // Format check: must match IANA pattern
  if (!IANA_TIMEZONE_REGEX.test(trimmed)) {
    return false;
  }

  // Definitive check: try to use with Intl.DateTimeFormat
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

@ValidatorConstraint({ name: 'isValidTimezone', async: false })
export class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return isValidTimezone(value);
  }

  defaultMessage(): string {
    return 'Timezone must be a valid IANA timezone identifier (e.g., Asia/Taipei, America/New_York, UTC)';
  }
}

/**
 * Custom decorator to validate IANA timezone identifiers
 * @param validationOptions - Optional validation options
 */
export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}

/**
 * Standalone function to validate IANA timezone identifiers
 * Can be used for runtime validation
 * @param timezone - The timezone string to validate
 * @returns true if the timezone is valid, false otherwise
 */
export { isValidTimezone };
