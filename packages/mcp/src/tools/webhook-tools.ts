/**
 * Webhook Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

const webhookEventEnum = [
  'url.created',
  'url.updated',
  'url.deleted',
  'url.clicked',
  'routing.rule_created',
  'routing.rule_updated',
  'routing.rule_deleted',
  'routing.rule_matched',
];

export function registerWebhookTools(apiClient: ApiClient) {
  return {
    create_webhook: {
      description:
        'Create a webhook to receive event notifications when URLs are created, clicked, deleted, or routing rules change.',
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
            items: { type: 'string', enum: webhookEventEnum },
            description:
              'Array of event types to subscribe to (min 1). Available events: url.created, url.updated, url.deleted, url.clicked, routing.rule_created, routing.rule_updated, routing.rule_deleted, routing.rule_matched',
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
      description:
        'List all webhooks with pagination. Sorted by createdAt (descending) by default.',
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
          sortBy: {
            type: 'string',
            enum: ['createdAt', 'name', 'url'],
            description: 'Sort field (optional, defaults to createdAt)',
          },
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
          webhookId: { type: 'string', description: 'Webhook ID' },
        },
        required: ['webhookId'],
      },
      handler: handleTool((args) => apiClient.getWebhook(args.webhookId)),
    },

    update_webhook: {
      description:
        'Update webhook settings including URL, events, headers, and active status.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: { type: 'string', description: 'Webhook ID' },
          name: { type: 'string', description: 'New name (optional)' },
          url: { type: 'string', description: 'New endpoint URL (optional)' },
          secret: { type: 'string', description: 'New secret (optional)' },
          events: {
            type: 'array',
            items: { type: 'string', enum: webhookEventEnum },
            description:
              'New event types (optional). Available: url.created, url.updated, url.deleted, url.clicked, routing.rule_created, routing.rule_updated, routing.rule_deleted, routing.rule_matched',
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
        required: ['webhookId'],
      },
      handler: handleTool((args) => {
        const { webhookId, ...data } = args;
        return apiClient.updateWebhook(webhookId, data);
      }),
    },

    delete_webhook: {
      description:
        '[DESTRUCTIVE] Delete a webhook and all its delivery logs. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: { type: 'string', description: 'Webhook ID' },
        },
        required: ['webhookId'],
      },
      handler: handleTool(
        (args) => apiClient.deleteWebhook(args.webhookId),
        (args) => `Webhook ${args.webhookId} has been successfully deleted`
      ),
    },

    get_webhook_logs: {
      description:
        'Get delivery logs for a specific webhook, including request/response details and errors.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: { type: 'string', description: 'Webhook ID' },
          page: {
            type: 'number',
            description: 'Page number (optional, defaults to 1)',
          },
          limit: {
            type: 'number',
            description: 'Items per page (optional, defaults to 10)',
          },
        },
        required: ['webhookId'],
      },
      handler: handleTool((args) => {
        const { webhookId, ...params } = args;
        return apiClient.getWebhookLogs(webhookId, params);
      }),
    },

    test_webhook: {
      description:
        'Send a test event to a webhook endpoint and return the delivery result.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: { type: 'string', description: 'Webhook ID' },
        },
        required: ['webhookId'],
      },
      handler: handleTool((args) => apiClient.testWebhook(args.webhookId)),
    },

    retry_webhook_delivery: {
      description:
        'Retry a failed webhook delivery using the original event and payload. Creates a new log entry with the retry result. Only failed deliveries can be retried.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: { type: 'string', description: 'Webhook ID' },
          logId: {
            type: 'string',
            description: 'Webhook log ID of the failed delivery',
          },
        },
        required: ['webhookId', 'logId'],
      },
      handler: handleTool((args) =>
        apiClient.retryWebhookDelivery(args.webhookId, args.logId)
      ),
    },
  };
}
