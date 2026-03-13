/**
 * Audit Log MCP Tools (Admin)
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerAuditLogTools(apiClient: ApiClient) {
  return {
    get_audit_logs: {
      description: 'Get audit logs with filtering and pagination (admin only). Tracks all system actions including user operations, URL changes, settings updates, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number (optional, defaults to 1)' },
          limit: { type: 'number', description: 'Items per page (optional, defaults to 10)' },
          action: { type: 'string', description: 'Filter by action type (e.g., URL_CREATED, USER_CREATED, optional)' },
          entityType: { type: 'string', description: 'Filter by entity type (e.g., URL, USER, optional)' },
          entityId: { type: 'string', description: 'Filter by specific entity ID (optional)' },
          userId: { type: 'string', description: 'Filter by user who performed the action (optional)' },
          startDate: { type: 'string', description: 'Start date filter in ISO 8601 format (optional)' },
          endDate: { type: 'string', description: 'End date filter in ISO 8601 format (optional)' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order (optional, defaults to desc)' },
        },
      },
      handler: handleTool((args) => apiClient.getAuditLogs(args)),
    },
  };
}
