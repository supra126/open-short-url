/**
 * Audit Log MCP Tools (Admin)
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

const auditActionEnum = [
  'URL_CREATED',
  'URL_UPDATED',
  'URL_DELETED',
  'URL_BULK_CREATED',
  'URL_BULK_UPDATED',
  'URL_BULK_DELETED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'API_KEY_CREATED',
  'API_KEY_DELETED',
  'SETTINGS_UPDATED',
  'PASSWORD_CHANGED',
  'TWO_FACTOR_ENABLED',
  'TWO_FACTOR_DISABLED',
  'VARIANT_CREATED',
  'VARIANT_UPDATED',
  'VARIANT_DELETED',
  'BUNDLE_CREATED',
  'BUNDLE_UPDATED',
  'BUNDLE_DELETED',
  'WEBHOOK_CREATED',
  'WEBHOOK_UPDATED',
  'WEBHOOK_DELETED',
  'WEBHOOK_RETRIED',
  'ROUTING_RULE_CREATED',
  'ROUTING_RULE_UPDATED',
  'ROUTING_RULE_DELETED',
  'SSO_LOGIN',
  'SSO_LOGIN_FAILED',
  'OIDC_PROVIDER_CREATED',
  'OIDC_PROVIDER_UPDATED',
  'OIDC_PROVIDER_DELETED',
  'OIDC_ACCOUNT_LINKED',
  'OIDC_ACCOUNT_UNLINKED',
  'SYSTEM_SETTING_UPDATED',
  'SYSTEM_SETTING_DELETED',
];

const auditEntityTypeEnum = [
  'url',
  'user',
  'api_key',
  'bundle',
  'webhook',
  'variant',
  'oidc_provider',
  'oidc_account',
  'system_setting',
];

export function registerAuditLogTools(apiClient: ApiClient) {
  return {
    get_audit_logs: {
      description:
        'Get audit logs with filtering and pagination (admin only). Tracks all system actions including user operations, URL changes, settings updates, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            description: 'Page number (optional, defaults to 1)',
          },
          limit: {
            type: 'number',
            description: 'Items per page (optional, defaults to 10)',
          },
          action: {
            type: 'string',
            enum: auditActionEnum,
            description: 'Filter by action type (optional)',
          },
          entityType: {
            type: 'string',
            enum: auditEntityTypeEnum,
            description: 'Filter by entity type (optional)',
          },
          entityId: {
            type: 'string',
            description: 'Filter by specific entity ID (optional)',
          },
          userId: {
            type: 'string',
            description: 'Filter by user who performed the action (optional)',
          },
          startDate: {
            type: 'string',
            description: 'Start date filter in ISO 8601 format (optional)',
          },
          endDate: {
            type: 'string',
            description: 'End date filter in ISO 8601 format (optional)',
          },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort order (optional, defaults to desc)',
          },
        },
      },
      handler: handleTool((args) => apiClient.getAuditLogs(args)),
    },
  };
}
