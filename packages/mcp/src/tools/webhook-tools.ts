/**
 * Webhook Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerWebhookTools(apiClient: ApiClient) {
  return {
    create_webhook: {
      description:
        'Create a webhook to receive event notifications (e.g., URL created, clicked, deleted).',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Webhook name (max 100 characters)',
          },
          url: {
            type: 'string',
            description: 'Webhook endpoint URL to receive POST requests',
          },
          secret: {
            type: 'string',
            description:
              'Secret for HMAC signature verification (max 255 characters)',
          },
          events: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of event types to subscribe to (min 1)',
          },
          headers: {
            type: 'object',
            description:
              'Custom HTTP headers to include in webhook requests (optional)',
          },
          isActive: {
            type: 'boolean',
            description: 'Enable the webhook (optional, defaults to true)',
          },
        },
        required: ['name', 'url', 'secret', 'events'],
      },
      handler: handleTool((args) => apiClient.createWebhook(args)),
    },

    list_webhooks: {
      description: 'List all webhooks with pagination.',
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
      handler: handleTool((args) => apiClient.listWebhooks(args)),
    },

    get_webhook: {
      description:
        'Get detailed information about a specific webhook including delivery statistics.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Webhook ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.getWebhook(args.id)),
    },

    update_webhook: {
      description:
        'Update webhook settings including URL, events, headers, and active status.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Webhook ID' },
          name: { type: 'string', description: 'New name (optional)' },
          url: { type: 'string', description: 'New endpoint URL (optional)' },
          secret: { type: 'string', description: 'New secret (optional)' },
          events: {
            type: 'array',
            items: { type: 'string' },
            description: 'New event types (optional)',
          },
          headers: {
            type: 'object',
            description: 'New custom headers (optional)',
          },
          isActive: {
            type: 'boolean',
            description: 'Enable/disable (optional)',
          },
        },
        required: ['id'],
      },
      handler: handleTool((args) => {
        const { id, ...data } = args;
        return apiClient.updateWebhook(id, data);
      }),
    },

    delete_webhook: {
      description:
        '[DESTRUCTIVE] Delete a webhook and all its delivery logs. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Webhook ID' },
        },
        required: ['id'],
      },
      handler: handleTool(
        (args) => apiClient.deleteWebhook(args.id),
        (args) => `Webhook ${args.id} has been successfully deleted`
      ),
    },

    get_webhook_logs: {
      description:
        'Get delivery logs for a specific webhook, including request/response details and errors.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Webhook ID' },
          page: {
            type: 'number',
            description: 'Page number (optional, defaults to 1)',
          },
          limit: {
            type: 'number',
            description: 'Items per page (optional, defaults to 10)',
          },
        },
        required: ['id'],
      },
      handler: handleTool((args) => {
        const { id, ...params } = args;
        return apiClient.getWebhookLogs(id, params);
      }),
    },

    test_webhook: {
      description:
        'Send a test event to a webhook endpoint and return the delivery result.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Webhook ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.testWebhook(args.id)),
    },
  };
}
