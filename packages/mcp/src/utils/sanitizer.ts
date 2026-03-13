/**
 * Sensitive data sanitizer for MCP tool responses
 *
 * Prevents API keys, passwords, secrets, and other sensitive data
 * from being exposed through the LLM context.
 */

/** Fields that should be fully redacted (replaced with placeholder) */
const REDACT_FIELDS = new Set([
  'key',
  'apiKey',
  'api_key',
  'secret',
  'clientSecret',
  'client_secret',
  'password',
  'newPassword',
  'new_password',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
]);

/** Fields that should be partially masked (show prefix only) */
const MASK_FIELDS = new Set(['key', 'apiKey', 'api_key']);

const REDACTED_PLACEHOLDER = '[REDACTED]';

/**
 * Mask a string value, showing only a prefix
 * e.g., "sk-ant-api03-abc123..." → "sk-ant-***"
 */
function maskValue(value: string): string {
  if (value.length <= 8) return REDACTED_PLACEHOLDER;
  // Show first 6 characters + mask
  return value.substring(0, 6) + '***' + REDACTED_PLACEHOLDER;
}

/**
 * Recursively sanitize an object by redacting sensitive fields.
 *
 * @param data - The data to sanitize (object, array, or primitive)
 * @returns A new object with sensitive fields redacted
 */
export function sanitize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (typeof value === 'string' && REDACT_FIELDS.has(key)) {
      // For fields that can be masked, show prefix; otherwise fully redact
      result[key] = MASK_FIELDS.has(key)
        ? maskValue(value)
        : REDACTED_PLACEHOLDER;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitize(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Sanitize a JSON string by parsing, sanitizing, and re-stringifying.
 */
export function sanitizeJson(json: string): string {
  try {
    const parsed: unknown = JSON.parse(json);
    return JSON.stringify(sanitize(parsed), null, 2);
  } catch {
    return json;
  }
}
