/**
 * Handler Execution Tests
 *
 * Verifies that tool handlers correctly:
 * 1. Extract and pass parameters to the API client methods
 * 2. Return properly formatted MCP responses
 * 3. Apply sanitization to responses
 * 4. Handle errors with sanitized messages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTool } from '../utils/tool-handler.js';

// ==================== handleTool wrapper tests ====================

describe('handleTool', () => {
  describe('success responses', () => {
    it('should format successful result as JSON text content', async () => {
      const fn = vi.fn().mockResolvedValue({ id: '1', name: 'test' });
      const handler = handleTool(fn);
      const result = await handler({ foo: 'bar' });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual({ id: '1', name: 'test' });
    });

    it('should pass args to the wrapped function', async () => {
      const fn = vi.fn().mockResolvedValue({});
      const handler = handleTool(fn);
      await handler({ urlId: 'abc', name: 'test' });

      expect(fn).toHaveBeenCalledWith({ urlId: 'abc', name: 'test' });
    });

    it('should use custom success message when provided', async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      const handler = handleTool(
        fn,
        (args) => `Deleted ${args.id}`
      );
      const result = await handler({ id: '123' });

      expect(result.content[0].text).toBe('Deleted 123');
      expect(result.isError).toBeUndefined();
    });

    it('should sanitize response data by default', async () => {
      const fn = vi.fn().mockResolvedValue({
        id: '1',
        key: 'sk-secret-super-long-key-value',
        name: 'test',
      });
      const handler = handleTool(fn);
      const result = await handler({});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe('1');
      expect(parsed.name).toBe('test');
      expect(parsed.key).toContain('[REDACTED]');
      expect(parsed.key).not.toContain('super-long-key-value');
    });

    it('should skip sanitization when skipSanitize is true', async () => {
      const fn = vi.fn().mockResolvedValue({
        key: 'sk-secret-super-long-key-value',
      });
      const handler = handleTool(fn, null, { skipSanitize: true });
      const result = await handler({});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.key).toBe('sk-secret-super-long-key-value');
    });

    it('should handle null/undefined results', async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      const handler = handleTool(fn);
      const result = await handler({});

      // undefined is coerced to null via ?? null, then JSON.stringify produces "null"
      expect(result.content[0].text).toBe('null');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('error responses', () => {
    it('should format errors with isError flag', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Not found'));
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Not found');
    });

    it('should handle non-Error thrown values', async () => {
      const fn = vi.fn().mockRejectedValue('string error');
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: string error');
    });

    it('should sanitize Bearer tokens from error messages', async () => {
      const fn = vi.fn().mockRejectedValue(
        new Error('Unauthorized: Bearer sk-ant-api03-realkey123 is invalid')
      );
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).not.toContain('sk-ant-api03-realkey123');
      expect(result.content[0].text).toContain('[REDACTED]');
    });

    it('should sanitize key= patterns from error messages', async () => {
      const fn = vi.fn().mockRejectedValue(
        new Error('Failed with key=mysecretkey123 in request')
      );
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).not.toContain('mysecretkey123');
      expect(result.content[0].text).toContain('[REDACTED]');
    });

    it('should sanitize token= patterns from error messages', async () => {
      const fn = vi.fn().mockRejectedValue(
        new Error('Request with token: abc123xyz failed')
      );
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).not.toContain('abc123xyz');
    });

    it('should sanitize secret= patterns from error messages', async () => {
      const fn = vi.fn().mockRejectedValue(
        new Error('Config error secret=my-client-secret-value')
      );
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).not.toContain('my-client-secret-value');
    });

    it('should preserve non-sensitive error messages as-is', async () => {
      const fn = vi.fn().mockRejectedValue(
        new Error('URL not found: 404')
      );
      const handler = handleTool(fn);
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: URL not found: 404');
    });
  });
});

// ==================== Handler parameter passing tests ====================

describe('Tool Handler Parameter Passing', () => {
  /**
   * Helper: create a mock API client that records method calls
   */
  function createMockClient() {
    const calls: Array<{ method: string; args: unknown[] }> = [];

    const handler = {
      get(_target: object, prop: string) {
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          return Promise.resolve({ id: 'mock', success: true });
        };
      },
    };

    const proxy = new Proxy({} as any, handler);
    return { client: proxy, calls };
  }

  // --- URL Tools ---

  describe('URL tools', () => {
    it('create_short_url should pass all args directly', async () => {
      const { client, calls } = createMockClient();
      const { registerUrlTools } = await import('../tools/url-tools.js');
      const tools = registerUrlTools(client);
      await tools.create_short_url.handler({
        originalUrl: 'https://example.com',
        customSlug: 'test',
        title: 'Test',
      });
      expect(calls[0].method).toBe('createUrl');
      expect(calls[0].args[0]).toEqual({
        originalUrl: 'https://example.com',
        customSlug: 'test',
        title: 'Test',
      });
    });

    it('update_short_url should extract id and pass rest as update data', async () => {
      const { client, calls } = createMockClient();
      const { registerUrlTools } = await import('../tools/url-tools.js');
      const tools = registerUrlTools(client);
      await tools.update_short_url.handler({
        id: 'url-123',
        title: 'New Title',
        status: 'INACTIVE',
      });
      expect(calls[0].method).toBe('updateUrl');
      expect(calls[0].args[0]).toBe('url-123');
      expect(calls[0].args[1]).toEqual({ title: 'New Title', status: 'INACTIVE' });
    });

    it('delete_short_url should pass id', async () => {
      const { client, calls } = createMockClient();
      const { registerUrlTools } = await import('../tools/url-tools.js');
      const tools = registerUrlTools(client);
      await tools.delete_short_url.handler({ id: 'url-456' });
      expect(calls[0].method).toBe('deleteUrl');
      expect(calls[0].args[0]).toBe('url-456');
    });

    it('generate_qrcode should extract id and pass options', async () => {
      const { client, calls } = createMockClient();
      const { registerUrlTools } = await import('../tools/url-tools.js');
      const tools = registerUrlTools(client);
      await tools.generate_qrcode.handler({ id: 'url-1', width: 500, color: '#FF0000' });
      expect(calls[0].method).toBe('generateQRCode');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toEqual({ width: 500, color: '#FF0000' });
    });
  });

  // --- Analytics Tools ---

  describe('Analytics tools', () => {
    it('get_url_analytics should extract urlId and pass params', async () => {
      const { client, calls } = createMockClient();
      const { registerAnalyticsTools } = await import('../tools/analytics-tools.js');
      const tools = registerAnalyticsTools(client);
      await tools.get_url_analytics.handler({
        urlId: 'url-1',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
      expect(calls[0].method).toBe('getUrlAnalytics');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toEqual({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
    });

    it('export_url_analytics should extract urlId and pass export params', async () => {
      const { client, calls } = createMockClient();
      const { registerAnalyticsTools } = await import('../tools/analytics-tools.js');
      const tools = registerAnalyticsTools(client);
      await tools.export_url_analytics.handler({
        urlId: 'url-1',
        format: 'csv',
        includeClicks: true,
      });
      expect(calls[0].method).toBe('exportUrlAnalytics');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toEqual({ format: 'csv', includeClicks: true });
    });

    it('export_all_analytics should pass params directly', async () => {
      const { client, calls } = createMockClient();
      const { registerAnalyticsTools } = await import('../tools/analytics-tools.js');
      const tools = registerAnalyticsTools(client);
      await tools.export_all_analytics.handler({ format: 'json' });
      expect(calls[0].method).toBe('exportAllAnalytics');
      expect(calls[0].args[0]).toEqual({ format: 'json' });
    });
  });

  // --- Variant Tools ---

  describe('Variant tools', () => {
    it('create_variant should extract urlId and pass variant data', async () => {
      const { client, calls } = createMockClient();
      const { registerVariantTools } = await import('../tools/variant-tools.js');
      const tools = registerVariantTools(client);
      await tools.create_variant.handler({
        urlId: 'url-1',
        name: 'Variant A',
        targetUrl: 'https://a.com',
        weight: 50,
      });
      expect(calls[0].method).toBe('createVariant');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toEqual({
        name: 'Variant A',
        targetUrl: 'https://a.com',
        weight: 50,
      });
    });

    it('update_variant should extract urlId, variantId and pass update data', async () => {
      const { client, calls } = createMockClient();
      const { registerVariantTools } = await import('../tools/variant-tools.js');
      const tools = registerVariantTools(client);
      await tools.update_variant.handler({
        urlId: 'url-1',
        variantId: 'v-1',
        weight: 75,
      });
      expect(calls[0].method).toBe('updateVariant');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toBe('v-1');
      expect(calls[0].args[2]).toEqual({ weight: 75 });
    });
  });

  // --- Routing Tools ---

  describe('Routing tools', () => {
    it('create_routing_rule should extract urlId and pass rule data', async () => {
      const { client, calls } = createMockClient();
      const { registerRoutingTools } = await import('../tools/routing-tools.js');
      const tools = registerRoutingTools(client);
      const conditions = {
        operator: 'AND',
        conditions: [{ type: 'COUNTRY', operator: 'EQUALS', value: 'TW' }],
      };
      await tools.create_routing_rule.handler({
        urlId: 'url-1',
        name: 'TW Rule',
        targetUrl: 'https://tw.example.com',
        conditions,
      });
      expect(calls[0].method).toBe('createRoutingRule');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toEqual({
        name: 'TW Rule',
        targetUrl: 'https://tw.example.com',
        conditions,
      });
    });

    it('update_routing_rule should extract urlId, ruleId and pass data', async () => {
      const { client, calls } = createMockClient();
      const { registerRoutingTools } = await import('../tools/routing-tools.js');
      const tools = registerRoutingTools(client);
      await tools.update_routing_rule.handler({
        urlId: 'url-1',
        ruleId: 'rule-1',
        name: 'Updated',
        priority: 100,
      });
      expect(calls[0].method).toBe('updateRoutingRule');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toBe('rule-1');
      expect(calls[0].args[2]).toEqual({ name: 'Updated', priority: 100 });
    });

    it('update_smart_routing_settings should extract urlId', async () => {
      const { client, calls } = createMockClient();
      const { registerRoutingTools } = await import('../tools/routing-tools.js');
      const tools = registerRoutingTools(client);
      await tools.update_smart_routing_settings.handler({
        urlId: 'url-1',
        isSmartRouting: true,
      });
      expect(calls[0].method).toBe('updateSmartRoutingSettings');
      expect(calls[0].args[0]).toBe('url-1');
      expect(calls[0].args[1]).toEqual({ isSmartRouting: true });
    });
  });

  // --- Webhook Tools ---

  describe('Webhook tools', () => {
    it('update_webhook should extract id and pass data', async () => {
      const { client, calls } = createMockClient();
      const { registerWebhookTools } = await import('../tools/webhook-tools.js');
      const tools = registerWebhookTools(client);
      await tools.update_webhook.handler({
        id: 'wh-1',
        name: 'Updated',
        isActive: false,
      });
      expect(calls[0].method).toBe('updateWebhook');
      expect(calls[0].args[0]).toBe('wh-1');
      expect(calls[0].args[1]).toEqual({ name: 'Updated', isActive: false });
    });

    it('get_webhook_logs should extract id and pass pagination', async () => {
      const { client, calls } = createMockClient();
      const { registerWebhookTools } = await import('../tools/webhook-tools.js');
      const tools = registerWebhookTools(client);
      await tools.get_webhook_logs.handler({ id: 'wh-1', page: 2, limit: 20 });
      expect(calls[0].method).toBe('getWebhookLogs');
      expect(calls[0].args[0]).toBe('wh-1');
      expect(calls[0].args[1]).toEqual({ page: 2, limit: 20 });
    });
  });

  // --- User Tools ---

  describe('User tools', () => {
    it('update_user_role should pass id and role object', async () => {
      const { client, calls } = createMockClient();
      const { registerUserTools } = await import('../tools/user-tools.js');
      const tools = registerUserTools(client);
      await tools.update_user_role.handler({ id: 'u-1', role: 'ADMIN' });
      expect(calls[0].method).toBe('updateUserRole');
      expect(calls[0].args[0]).toBe('u-1');
      expect(calls[0].args[1]).toEqual({ role: 'ADMIN' });
    });

    it('update_user_status should pass id and isActive object', async () => {
      const { client, calls } = createMockClient();
      const { registerUserTools } = await import('../tools/user-tools.js');
      const tools = registerUserTools(client);
      await tools.update_user_status.handler({ id: 'u-1', isActive: false });
      expect(calls[0].method).toBe('updateUserStatus');
      expect(calls[0].args[0]).toBe('u-1');
      expect(calls[0].args[1]).toEqual({ isActive: false });
    });

    it('reset_user_password should pass id and password object', async () => {
      const { client, calls } = createMockClient();
      const { registerUserTools } = await import('../tools/user-tools.js');
      const tools = registerUserTools(client);
      await tools.reset_user_password.handler({ id: 'u-1', newPassword: 'newpass123' });
      expect(calls[0].method).toBe('resetUserPassword');
      expect(calls[0].args[0]).toBe('u-1');
      expect(calls[0].args[1]).toEqual({ newPassword: 'newpass123' });
    });

    it('unlink_user_oidc_account should pass userId and accountId', async () => {
      const { client, calls } = createMockClient();
      const { registerUserTools } = await import('../tools/user-tools.js');
      const tools = registerUserTools(client);
      await tools.unlink_user_oidc_account.handler({ userId: 'u-1', accountId: 'oidc-1' });
      expect(calls[0].method).toBe('unlinkUserOidcAccount');
      expect(calls[0].args[0]).toBe('u-1');
      expect(calls[0].args[1]).toBe('oidc-1');
    });
  });

  // --- OIDC Tools ---

  describe('OIDC tools', () => {
    it('update_oidc_provider should extract slug and pass data', async () => {
      const { client, calls } = createMockClient();
      const { registerOidcTools } = await import('../tools/oidc-tools.js');
      const tools = registerOidcTools(client);
      await tools.update_oidc_provider.handler({
        slug: 'google',
        name: 'Google SSO',
        isActive: true,
      });
      expect(calls[0].method).toBe('updateOidcProvider');
      expect(calls[0].args[0]).toBe('google');
      expect(calls[0].args[1]).toEqual({ name: 'Google SSO', isActive: true });
    });
  });

  // --- Settings Tools ---

  describe('Settings tools', () => {
    it('update_system_setting should extract key and pass data', async () => {
      const { client, calls } = createMockClient();
      const { registerSettingsTools } = await import('../tools/settings-tools.js');
      const tools = registerSettingsTools(client);
      await tools.update_system_setting.handler({
        key: 'allowRegistration',
        value: false,
        description: 'Disable registration',
      });
      expect(calls[0].method).toBe('updateSystemSetting');
      expect(calls[0].args[0]).toBe('allowRegistration');
      expect(calls[0].args[1]).toEqual({
        value: false,
        description: 'Disable registration',
      });
    });
  });

  // --- Bundle Tools ---

  describe('Bundle tools', () => {
    it('update_bundle should extract id and pass data', async () => {
      const { client, calls } = createMockClient();
      const { registerBundleTools } = await import('../tools/bundle-tools.js');
      const tools = registerBundleTools(client);
      await tools.update_bundle.handler({
        id: 'b-1',
        name: 'Updated Bundle',
        color: '#FF0000',
      });
      expect(calls[0].method).toBe('updateBundle');
      expect(calls[0].args[0]).toBe('b-1');
      expect(calls[0].args[1]).toEqual({ name: 'Updated Bundle', color: '#FF0000' });
    });

    it('add_url_to_bundle should construct correct payload', async () => {
      const { client, calls } = createMockClient();
      const { registerBundleTools } = await import('../tools/bundle-tools.js');
      const tools = registerBundleTools(client);
      await tools.add_url_to_bundle.handler({ bundleId: 'b-1', urlId: 'url-1' });
      expect(calls[0].method).toBe('addUrlToBundle');
      expect(calls[0].args[0]).toBe('b-1');
      expect(calls[0].args[1]).toEqual({ urlId: 'url-1' });
    });
  });
});
