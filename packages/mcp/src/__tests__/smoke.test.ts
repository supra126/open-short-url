/**
 * MCP Tools Smoke Tests
 *
 * Verifies:
 * 1. All tool modules register correctly
 * 2. Every tool has required fields (description, inputSchema, handler)
 * 3. Destructive tools are properly marked
 * 4. Sensitive data sanitization works
 * 5. Tool count matches expectations
 */

import { describe, it, expect } from 'vitest';
import { ApiClient } from '../utils/api-client.js';
import { registerUrlTools } from '../tools/url-tools.js';
import { registerAnalyticsTools } from '../tools/analytics-tools.js';
import { registerVariantTools } from '../tools/variant-tools.js';
import { registerBundleTools } from '../tools/bundle-tools.js';
import { registerRoutingTools } from '../tools/routing-tools.js';
import { registerWebhookTools } from '../tools/webhook-tools.js';
import { registerUserTools } from '../tools/user-tools.js';
import { registerApiKeyTools } from '../tools/api-key-tools.js';
import { registerOidcTools } from '../tools/oidc-tools.js';
import { registerSettingsTools } from '../tools/settings-tools.js';
import { registerAuditLogTools } from '../tools/audit-log-tools.js';
import { sanitize } from '../utils/sanitizer.js';

// Create a dummy client for tool registration tests
const dummyClient = new ApiClient('http://localhost:3100', { apiKey: 'test' });

// Register all tool modules
const allModules = {
  url: registerUrlTools(dummyClient),
  analytics: registerAnalyticsTools(dummyClient),
  variant: registerVariantTools(dummyClient),
  bundle: registerBundleTools(dummyClient),
  routing: registerRoutingTools(dummyClient),
  webhook: registerWebhookTools(dummyClient),
  user: registerUserTools(dummyClient),
  apiKey: registerApiKeyTools(dummyClient),
  oidc: registerOidcTools(dummyClient),
  settings: registerSettingsTools(dummyClient),
  auditLog: registerAuditLogTools(dummyClient),
};

// Flatten all tools
const allTools: Record<string, any> = {};
for (const tools of Object.values(allModules)) {
  Object.assign(allTools, tools);
}

describe('MCP Tool Registration', () => {
  it('should register all 11 tool modules', () => {
    expect(Object.keys(allModules)).toHaveLength(11);
  });

  it('should register expected number of tools per module', () => {
    expect(Object.keys(allModules.url)).toHaveLength(10); // 7 original + 3 bulk
    expect(Object.keys(allModules.analytics)).toHaveLength(10); // 8 original + 2 export
    expect(Object.keys(allModules.variant)).toHaveLength(5);
    expect(Object.keys(allModules.bundle)).toHaveLength(12);
    expect(Object.keys(allModules.routing)).toHaveLength(8);
    expect(Object.keys(allModules.webhook)).toHaveLength(7);
    expect(Object.keys(allModules.user)).toHaveLength(11);
    expect(Object.keys(allModules.apiKey)).toHaveLength(4);
    expect(Object.keys(allModules.oidc)).toHaveLength(5);
    expect(Object.keys(allModules.settings)).toHaveLength(4);
    expect(Object.keys(allModules.auditLog)).toHaveLength(1);
  });

  it('should have no duplicate tool names across modules', () => {
    const names: string[] = [];
    for (const tools of Object.values(allModules)) {
      names.push(...Object.keys(tools));
    }
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('Tool Structure', () => {
  const toolEntries = Object.entries(allTools);

  it.each(toolEntries)(
    '%s should have description, inputSchema, and handler',
    (_name, tool) => {
      expect(tool).toHaveProperty('description');
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(10);

      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
      expect(tool.inputSchema).toHaveProperty('properties');

      expect(tool).toHaveProperty('handler');
      expect(typeof tool.handler).toBe('function');
    }
  );

  it.each(toolEntries)(
    '%s inputSchema required fields should exist in properties',
    (_name, tool) => {
      const required = tool.inputSchema.required || [];
      const properties = Object.keys(tool.inputSchema.properties || {});
      for (const field of required) {
        expect(properties).toContain(field);
      }
    }
  );
});

describe('Destructive Tool Marking', () => {
  const destructiveToolNames = [
    'delete_short_url',
    'bulk_delete_urls',
    'delete_variant',
    'delete_bundle',
    'delete_routing_rule',
    'delete_webhook',
    'delete_user',
    'reset_user_password',
    'disable_user_2fa',
    'unlink_user_oidc_account',
    'delete_api_key',
    'delete_oidc_provider',
    'delete_system_setting',
  ];

  it.each(destructiveToolNames)(
    '%s should be marked as [DESTRUCTIVE]',
    (name) => {
      const tool = allTools[name];
      expect(tool).toBeDefined();
      expect(tool.description).toContain('[DESTRUCTIVE]');
      expect(tool.description.toLowerCase()).toContain('confirm');
    }
  );

  it('non-destructive tools should not be marked as destructive', () => {
    const nonDestructiveTools = Object.entries(allTools).filter(
      ([name]) => !destructiveToolNames.includes(name)
    );
    for (const [_name, tool] of nonDestructiveTools) {
      expect((tool as any).description).not.toContain('[DESTRUCTIVE]');
    }
  });
});

describe('Sensitive Data Sanitization', () => {
  it('should redact API key fields', () => {
    const data = {
      id: '123',
      name: 'My Key',
      key: 'osu_prod_abcdefghijklmnop',
      prefix: 'osu_prod_1234',
    };
    const result = sanitize(data);
    expect(result.id).toBe('123');
    expect(result.name).toBe('My Key');
    expect(result.key).not.toContain('abcdefghijklmnop');
    expect(result.key).toContain('[REDACTED]');
    expect(result.prefix).toBe('osu_prod_1234'); // prefix is not sensitive
  });

  it('should redact client secrets', () => {
    const data = {
      clientId: 'my-app',
      clientSecret: 'super-secret-value-12345',
    };
    const result = sanitize(data);
    expect(result.clientId).toBe('my-app');
    expect(result.clientSecret).toContain('[REDACTED]');
    expect(result.clientSecret).not.toContain('super-secret-value-12345');
  });

  it('should redact password fields', () => {
    const data = { password: 'my-password-123', email: 'test@example.com' };
    const result = sanitize(data);
    expect(result.password).toBe('[REDACTED]');
    expect(result.email).toBe('test@example.com');
  });

  it('should redact nested sensitive fields', () => {
    const data = {
      user: { id: '1', token: 'abc123token' },
      items: [{ secret: 'item-secret-value' }],
    };
    const result = sanitize(data);
    expect(result.user.token).toBe('[REDACTED]');
    expect(result.user.id).toBe('1');
    expect(result.items[0].secret).toContain('[REDACTED]');
  });

  it('should handle null and undefined gracefully', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
    expect(sanitize({ key: null })).toEqual({ key: null });
  });

  it('should not modify non-sensitive fields', () => {
    const data = {
      id: '123',
      name: 'Test URL',
      slug: 'abc',
      originalUrl: 'https://example.com',
      clickCount: 42,
      isActive: true,
    };
    const result = sanitize(data);
    expect(result).toEqual(data);
  });
});
