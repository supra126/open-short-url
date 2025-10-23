/**
 * URL Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';

export function registerUrlTools(apiClient: ApiClient) {
  return {
    /**
     * Create short URL
     */
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
          utmSource: {
            type: 'string',
            description: 'UTM source parameter (optional, used for tracking marketing campaigns)',
          },
          utmMedium: {
            type: 'string',
            description: 'UTM medium parameter (optional)',
          },
          utmCampaign: {
            type: 'string',
            description: 'UTM campaign parameter (optional)',
          },
          utmTerm: {
            type: 'string',
            description: 'UTM term parameter (optional)',
          },
          utmContent: {
            type: 'string',
            description: 'UTM content parameter (optional)',
          },
        },
        required: ['originalUrl'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.createUrl(args);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    },

    /**
     * List short URLs
     */
    list_short_urls: {
      description: 'List all short URLs with support for pagination, search, filtering, and sorting.',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            description: 'Page number (starts from 1, defaults to 1)',
            default: 1,
          },
          pageSize: {
            type: 'number',
            description: 'Items per page (defaults to 10, max 100)',
            default: 10,
          },
          search: {
            type: 'string',
            description: 'Search keyword (searches in title and original URL)',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE'],
            description: 'Filter by status',
          },
          sortBy: {
            type: 'string',
            description: 'Sort field (e.g., createdAt, clickCount)',
          },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort direction (asc: ascending, desc: descending)',
          },
        },
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.listUrls(args);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    },

    /**
     * Get short URL details
     */
    get_short_url: {
      description: 'Get detailed information about a specific short URL.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Short URL ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getUrl(args.id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    },

    /**
     * Update short URL
     */
    update_short_url: {
      description: 'Update short URL settings including original URL, title, status, password, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Short URL ID',
          },
          originalUrl: {
            type: 'string',
            description: 'New original URL (optional)',
          },
          title: {
            type: 'string',
            description: 'New title (optional)',
          },
          description: {
            type: 'string',
            description: 'New description (optional)',
          },
          password: {
            type: 'string',
            description: 'New password (optional, set to empty string to remove password)',
          },
          expiresAt: {
            type: 'string',
            description: 'New expiration time (optional, ISO 8601 format)',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE'],
            description: 'New status (optional)',
          },
          utmSource: {
            type: 'string',
            description: 'UTM source parameter (optional)',
          },
          utmMedium: {
            type: 'string',
            description: 'UTM medium parameter (optional)',
          },
          utmCampaign: {
            type: 'string',
            description: 'UTM campaign parameter (optional)',
          },
          utmTerm: {
            type: 'string',
            description: 'UTM term parameter (optional)',
          },
          utmContent: {
            type: 'string',
            description: 'UTM content parameter (optional)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          const { id, ...updateData } = args;
          const result = await apiClient.updateUrl(id, updateData);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    },

    /**
     * Delete short URL
     */
    delete_short_url: {
      description: 'Delete the specified short URL and all related data (including click records).',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Short URL ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          await apiClient.deleteUrl(args.id);
          return {
            content: [
              {
                type: 'text',
                text: `Short URL ${args.id} has been successfully deleted`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    },

    /**
     * Generate QR code
     */
    generate_qrcode: {
      description: 'Generate a QR code for the specified short URL (returns Base64 Data URL format).',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Short URL ID',
          },
          width: {
            type: 'number',
            description: 'QR code width in pixels (optional, defaults to 300)',
            default: 300,
          },
          color: {
            type: 'string',
            description: 'QR code color in hex format (optional, defaults to black)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          const { id, width, color } = args;
          const result = await apiClient.generateQRCode(id, { width, color });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    },
  };
}
