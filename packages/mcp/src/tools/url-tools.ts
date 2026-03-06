/**
 * URL Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerUrlTools(apiClient: ApiClient) {
  return {
    create_short_url: {
      description: 'Create a new short URL with optional features like custom slug, password protection, expiration time, and UTM parameters.',
      inputSchema: {
        type: 'object',
        properties: {
          originalUrl: {
            type: 'string',
            description: 'The original URL to shorten (must include http:// or https://)',
          },
          customSlug: {
            type: 'string',
            description: 'Custom slug for the short URL (optional, auto-generated if not provided)',
          },
          title: {
            type: 'string',
            description: 'Title for the short URL (optional, used for management and identification)',
          },
          description: {
            type: 'string',
            description: 'Description of the short URL (optional)',
          },
          password: {
            type: 'string',
            description: 'Access password (optional, visitors must enter password to access if set)',
          },
          expiresAt: {
            type: 'string',
            description: 'Expiration time (optional, ISO 8601 format, e.g., 2025-12-31T23:59:59Z)',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE'],
            description: 'Status (optional, defaults to ACTIVE)',
          },
          utmSource: { type: 'string', description: 'UTM source parameter (optional)' },
          utmMedium: { type: 'string', description: 'UTM medium parameter (optional)' },
          utmCampaign: { type: 'string', description: 'UTM campaign parameter (optional)' },
          utmTerm: { type: 'string', description: 'UTM term parameter (optional)' },
          utmContent: { type: 'string', description: 'UTM content parameter (optional)' },
        },
        required: ['originalUrl'],
      },
      handler: handleTool((args) => apiClient.createUrl(args)),
    },

    list_short_urls: {
      description: 'List all short URLs with support for pagination, search, filtering, and sorting.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number (starts from 1, defaults to 1)', default: 1 },
          pageSize: { type: 'number', description: 'Items per page (defaults to 10, max 100)', default: 10 },
          search: { type: 'string', description: 'Search keyword (searches in title and original URL)' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], description: 'Filter by status' },
          sortBy: { type: 'string', description: 'Sort field (e.g., createdAt, clickCount)' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        },
      },
      handler: handleTool((args) => apiClient.listUrls(args)),
    },

    get_short_url: {
      description: 'Get detailed information about a specific short URL.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Short URL ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.getUrl(args.id)),
    },

    update_short_url: {
      description: 'Update short URL settings including original URL, title, status, password, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Short URL ID' },
          originalUrl: { type: 'string', description: 'New original URL (optional)' },
          title: { type: 'string', description: 'New title (optional)' },
          description: { type: 'string', description: 'New description (optional)' },
          password: { type: 'string', description: 'New password (optional, set to empty string to remove password)' },
          expiresAt: { type: 'string', description: 'New expiration time (optional, ISO 8601 format)' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], description: 'New status (optional)' },
          utmSource: { type: 'string', description: 'UTM source parameter (optional)' },
          utmMedium: { type: 'string', description: 'UTM medium parameter (optional)' },
          utmCampaign: { type: 'string', description: 'UTM campaign parameter (optional)' },
          utmTerm: { type: 'string', description: 'UTM term parameter (optional)' },
          utmContent: { type: 'string', description: 'UTM content parameter (optional)' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => {
        const { id, ...updateData } = args;
        return apiClient.updateUrl(id, updateData);
      }),
    },

    delete_short_url: {
      description: 'Delete the specified short URL and all related data (including click records).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Short URL ID' },
        },
        required: ['id'],
      },
      handler: handleTool(
        (args) => apiClient.deleteUrl(args.id),
        (args) => `Short URL ${args.id} has been successfully deleted`
      ),
    },

    get_url_stats: {
      description: 'Get dashboard statistics including total, active, inactive, and expired URL counts.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: handleTool(() => apiClient.getUrlStats()),
    },

    generate_qrcode: {
      description: 'Generate a QR code for the specified short URL (returns Base64 Data URL format).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Short URL ID' },
          width: { type: 'number', description: 'QR code width in pixels (optional, defaults to 300)', default: 300 },
          color: { type: 'string', description: 'QR code color in hex format (optional, e.g., #000000)' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => {
        const { id, ...options } = args;
        return apiClient.generateQRCode(id, options);
      }),
    },

    bulk_create_urls: {
      description: 'Bulk create multiple short URLs in a single request (max 100). Returns success/failure details for each URL.',
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                originalUrl: { type: 'string', description: 'The original URL to shorten' },
                customSlug: { type: 'string', description: 'Custom slug (optional)' },
                title: { type: 'string', description: 'Title (optional)' },
                description: { type: 'string', description: 'Description (optional)' },
                password: { type: 'string', description: 'Access password (optional)' },
                expiresAt: { type: 'string', description: 'Expiration time in ISO 8601 format (optional)' },
                status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], description: 'Status (optional)' },
                utmSource: { type: 'string', description: 'UTM source (optional)' },
                utmMedium: { type: 'string', description: 'UTM medium (optional)' },
                utmCampaign: { type: 'string', description: 'UTM campaign (optional)' },
                utmTerm: { type: 'string', description: 'UTM term (optional)' },
                utmContent: { type: 'string', description: 'UTM content (optional)' },
              },
              required: ['originalUrl'],
            },
            description: 'Array of URLs to create (max 100)',
            minItems: 1,
            maxItems: 100,
          },
        },
        required: ['urls'],
      },
      handler: handleTool((args) => apiClient.bulkCreateUrls(args)),
    },

    bulk_update_urls: {
      description: `Bulk update multiple short URLs with a single operation. Supported operations: status (change ACTIVE/INACTIVE), bundle (add to bundle), expiration (set/remove expiry), utm (update UTM parameters).`,
      inputSchema: {
        type: 'object',
        properties: {
          urlIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of URL IDs to update (max 100)',
            minItems: 1,
            maxItems: 100,
          },
          operation: {
            type: 'object',
            description: 'Update operation. Must include "type" field: "status", "bundle", "expiration", or "utm"',
            properties: {
              type: {
                type: 'string',
                enum: ['status', 'bundle', 'expiration', 'utm'],
                description: 'Operation type',
              },
              status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], description: 'New status (for type=status)' },
              bundleId: { type: 'string', description: 'Bundle ID (for type=bundle)' },
              expiresAt: { type: 'string', description: 'Expiration date in ISO 8601 format, null to remove (for type=expiration)' },
              utmSource: { type: 'string', description: 'UTM source (for type=utm)' },
              utmMedium: { type: 'string', description: 'UTM medium (for type=utm)' },
              utmCampaign: { type: 'string', description: 'UTM campaign (for type=utm)' },
              utmTerm: { type: 'string', description: 'UTM term (for type=utm)' },
              utmContent: { type: 'string', description: 'UTM content (for type=utm)' },
            },
            required: ['type'],
          },
        },
        required: ['urlIds', 'operation'],
      },
      handler: handleTool((args) => apiClient.bulkUpdateUrls(args)),
    },

    bulk_delete_urls: {
      description: 'Bulk delete multiple short URLs and all their related data (max 100).',
      inputSchema: {
        type: 'object',
        properties: {
          urlIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of URL IDs to delete (max 100)',
            minItems: 1,
            maxItems: 100,
          },
        },
        required: ['urlIds'],
      },
      handler: handleTool((args) => apiClient.bulkDeleteUrls(args)),
    },
  };
}
