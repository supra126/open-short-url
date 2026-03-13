/**
 * API Key Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerApiKeyTools(apiClient: ApiClient) {
  return {
    create_api_key: {
      description:
        'Create a new API key for programmatic access. The full key is redacted in the response for security — the user should copy it from the dashboard.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'API key name (1-100 characters)',
          },
          expiresAt: {
            type: 'string',
            description:
              'Expiration date in ISO 8601 format (optional, no expiration if not set)',
          },
        },
        required: ['name'],
      },
      handler: handleTool(
        (args) => apiClient.createApiKey(args),
        (args) =>
          `API key "${args.name}" created successfully. The full key is only visible in the dashboard — copy it from there before navigating away.`
      ),
    },

    list_api_keys: {
      description:
        'List all API keys with pagination. Only shows key prefixes, not full keys.',
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
          sortBy: { type: 'string', description: 'Sort field (optional)' },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort direction (optional)',
          },
        },
      },
      handler: handleTool((args) => apiClient.listApiKeys(args)),
    },

    get_api_key: {
      description: 'Get detailed information about a specific API key.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'API key ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.getApiKey(args.id)),
    },

    delete_api_key: {
      description:
        '[DESTRUCTIVE] Delete an API key. Any applications using this key will lose access immediately. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'API key ID' },
        },
        required: ['id'],
      },
      handler: handleTool(
        (args) => apiClient.deleteApiKey(args.id),
        (args) => `API key ${args.id} has been successfully deleted`
      ),
    },
  };
}
