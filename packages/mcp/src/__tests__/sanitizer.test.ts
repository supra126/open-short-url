/**
 * Sanitizer Edge Case Tests
 *
 * Thorough testing of the sanitizer utility for boundary conditions,
 * deeply nested data, mixed types, and sanitizeJson.
 */

import { describe, it, expect } from 'vitest';
import { sanitize, sanitizeJson } from '../utils/sanitizer.js';

describe('Sanitizer - Edge Cases', () => {
  // --- Primitives ---

  it('should return strings as-is', () => {
    expect(sanitize('hello')).toBe('hello');
  });

  it('should return numbers as-is', () => {
    expect(sanitize(42)).toBe(42);
    expect(sanitize(0)).toBe(0);
    expect(sanitize(-1)).toBe(-1);
    expect(sanitize(3.14)).toBe(3.14);
  });

  it('should return booleans as-is', () => {
    expect(sanitize(true)).toBe(true);
    expect(sanitize(false)).toBe(false);
  });

  it('should return null as-is', () => {
    expect(sanitize(null)).toBeNull();
  });

  it('should return undefined as-is', () => {
    expect(sanitize(undefined)).toBeUndefined();
  });

  // --- Empty containers ---

  it('should handle empty objects', () => {
    expect(sanitize({})).toEqual({});
  });

  it('should handle empty arrays', () => {
    expect(sanitize([])).toEqual([]);
  });

  // --- String length edge cases for masking ---

  it('should fully redact short keys (<=8 chars)', () => {
    const result = sanitize({ key: 'short' });
    expect(result.key).toBe('[REDACTED]');
  });

  it('should fully redact keys with exactly 8 chars', () => {
    const result = sanitize({ key: '12345678' });
    expect(result.key).toBe('[REDACTED]');
  });

  it('should partially mask keys with 9+ chars', () => {
    const result = sanitize({ key: '123456789' });
    expect(result.key).toBe('123456***[REDACTED]');
  });

  it('should handle empty string sensitive fields', () => {
    const result = sanitize({ key: '', password: '' });
    // Empty strings <= 8 chars, so fully redacted
    expect(result.key).toBe('[REDACTED]');
    expect(result.password).toBe('[REDACTED]');
  });

  // --- MASK_FIELDS vs REDACT-only fields ---

  it('should partially mask MASK_FIELDS (key, apiKey, api_key only)', () => {
    const long = 'abcdefghijklmnop';
    const result = sanitize({
      key: long,
      apiKey: long,
      api_key: long,
    });
    for (const field of ['key', 'apiKey', 'api_key']) {
      expect(result[field]).toBe('abcdef***[REDACTED]');
    }
  });

  it('should fully redact non-MASK fields (password, token, secret, etc.)', () => {
    const long = 'abcdefghijklmnop';
    const result = sanitize({
      password: long,
      newPassword: long,
      new_password: long,
      token: long,
      accessToken: long,
      access_token: long,
      refreshToken: long,
      refresh_token: long,
      secret: long,
      clientSecret: long,
      client_secret: long,
    });
    for (const field of [
      'password',
      'newPassword',
      'new_password',
      'token',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
      'secret',
      'clientSecret',
      'client_secret',
    ]) {
      expect(result[field]).toBe('[REDACTED]');
    }
  });

  // --- Non-string sensitive fields should not be redacted ---

  it('should not redact non-string values in sensitive field names', () => {
    const result = sanitize({
      key: 123,
      password: true,
      token: null,
      secret: undefined,
    });
    expect(result.key).toBe(123);
    expect(result.password).toBe(true);
    expect(result.token).toBeNull();
    expect(result.secret).toBeUndefined();
  });

  // --- Deep nesting ---

  it('should sanitize 3 levels deep', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            apiKey: 'deep-nested-secret-key',
            name: 'safe',
          },
        },
      },
    };
    const result = sanitize(data);
    expect(result.level1.level2.level3.apiKey).toContain('[REDACTED]');
    expect(result.level1.level2.level3.name).toBe('safe');
  });

  it('should sanitize arrays of objects', () => {
    const data = [
      { id: '1', token: 'secret-token-1' },
      { id: '2', token: 'secret-token-2' },
      { id: '3', name: 'no-secret' },
    ];
    const result = sanitize(data);
    expect(result[0].token).toBe('[REDACTED]');
    expect(result[1].token).toBe('[REDACTED]');
    expect(result[0].id).toBe('1');
    expect(result[2].name).toBe('no-secret');
  });

  it('should handle mixed nested arrays and objects', () => {
    const data = {
      users: [
        {
          id: '1',
          keys: [{ key: 'user1-key-value-long' }],
        },
      ],
    };
    const result = sanitize(data);
    expect(result.users[0].id).toBe('1');
    expect(result.users[0].keys[0].key).toContain('[REDACTED]');
  });

  // --- Immutability ---

  it('should not mutate the original object', () => {
    const original = {
      key: 'original-secret-value-long',
      name: 'test',
      nested: { password: 'pass123' },
    };
    const originalCopy = JSON.parse(JSON.stringify(original));
    sanitize(original);
    expect(original).toEqual(originalCopy);
  });

  // --- Fields that look sensitive but aren't ---

  it('should not redact fields with similar but non-matching names', () => {
    const data = {
      keyword: 'search term',
      tokenCount: 42,
      secretMessage: 'hello',
      passwordLength: 12,
      keyName: 'my-key',
    };
    const result = sanitize(data);
    expect(result).toEqual(data);
  });
});

describe('sanitizeJson', () => {
  it('should parse, sanitize, and re-stringify JSON', () => {
    const json = JSON.stringify({ key: 'long-secret-key-value', name: 'test' });
    const result = sanitizeJson(json);
    const parsed = JSON.parse(result);
    expect(parsed.key).toContain('[REDACTED]');
    expect(parsed.name).toBe('test');
  });

  it('should return invalid JSON as-is', () => {
    const invalid = 'not json {{{';
    expect(sanitizeJson(invalid)).toBe(invalid);
  });

  it('should handle JSON with nested sensitive data', () => {
    const json = JSON.stringify({
      data: [{ password: 'secret123', id: '1' }],
    });
    const result = sanitizeJson(json);
    const parsed = JSON.parse(result);
    expect(parsed.data[0].password).toBe('[REDACTED]');
    expect(parsed.data[0].id).toBe('1');
  });

  it('should handle empty JSON object', () => {
    expect(sanitizeJson('{}')).toBe('{}');
  });

  it('should handle JSON array', () => {
    const json = JSON.stringify([{ token: 'abc' }]);
    const result = sanitizeJson(json);
    const parsed = JSON.parse(result);
    expect(parsed[0].token).toBe('[REDACTED]');
  });
});
