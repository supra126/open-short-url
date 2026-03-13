/**
 * Bundle Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerBundleTools(apiClient: ApiClient) {
  return {
    create_bundle: {
      description: 'Create a new bundle to organize and group multiple short URLs together.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Bundle name' },
          description: { type: 'string', description: 'Bundle description (optional)' },
          color: { type: 'string', description: 'Bundle color code (optional, e.g., #FF5733)' },
          icon: { type: 'string', description: 'Bundle icon name (optional)' },
          urlIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of URL IDs to add to the bundle (optional)',
          },
        },
        required: ['name'],
      },
      handler: handleTool((args) => apiClient.createBundle(args)),
    },

    list_bundles: {
      description: 'List all bundles with pagination and filtering options.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number (optional, defaults to 1)', default: 1 },
          pageSize: { type: 'number', description: 'Number of bundles per page (optional, defaults to 10)', default: 10 },
          status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED'], description: 'Filter by status (optional)' },
          search: { type: 'string', description: 'Search by bundle name (optional)' },
        },
      },
      handler: handleTool((args) => apiClient.listBundles(args)),
    },

    get_bundle: {
      description: 'Get detailed information about a specific bundle, including its URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bundle ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.getBundle(args.id)),
    },

    update_bundle: {
      description: 'Update bundle information including name, description, color, and icon. Use archive_bundle/restore_bundle to change status.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bundle ID' },
          name: { type: 'string', description: 'New bundle name (optional)' },
          description: { type: 'string', description: 'New description (optional)' },
          color: { type: 'string', description: 'New color code (optional)' },
          icon: { type: 'string', description: 'New icon name (optional)' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => {
        const { id, ...updateData } = args;
        return apiClient.updateBundle(id, updateData);
      }),
    },

    delete_bundle: {
      description: '[DESTRUCTIVE] Delete a bundle. This does not delete the URLs within the bundle. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bundle ID' },
        },
        required: ['id'],
      },
      handler: handleTool(
        (args) => apiClient.deleteBundle(args.id),
        (args) => `Bundle ${args.id} has been successfully deleted`
      ),
    },

    add_url_to_bundle: {
      description: 'Add a single short URL to an existing bundle.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
          urlId: { type: 'string', description: 'URL ID to add' },
        },
        required: ['bundleId', 'urlId'],
      },
      handler: handleTool((args) =>
        apiClient.addUrlToBundle(args.bundleId, { urlId: args.urlId })
      ),
    },

    add_multiple_urls_to_bundle: {
      description: 'Add multiple short URLs to an existing bundle at once.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
          urlIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of URL IDs to add',
          },
        },
        required: ['bundleId', 'urlIds'],
      },
      handler: handleTool((args) =>
        apiClient.addMultipleUrlsToBundle(args.bundleId, { urlIds: args.urlIds })
      ),
    },

    remove_url_from_bundle: {
      description: 'Remove a short URL from a bundle. This does not delete the URL itself.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
          urlId: { type: 'string', description: 'URL ID to remove' },
        },
        required: ['bundleId', 'urlId'],
      },
      handler: handleTool((args) =>
        apiClient.removeUrlFromBundle(args.bundleId, args.urlId)
      ),
    },

    update_url_order_in_bundle: {
      description: 'Update the display order of a URL within a bundle.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
          urlId: { type: 'string', description: 'URL ID' },
          order: { type: 'number', description: 'New order position (0-based index)' },
        },
        required: ['bundleId', 'urlId', 'order'],
      },
      handler: handleTool((args) =>
        apiClient.updateUrlOrder(args.bundleId, args.urlId, args.order)
      ),
    },

    get_bundle_stats: {
      description: 'Get statistics for a bundle including total clicks, URL count, and top performing URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
        },
        required: ['bundleId'],
      },
      handler: handleTool((args) => apiClient.getBundleStats(args.bundleId)),
    },

    archive_bundle: {
      description: 'Archive a bundle to hide it from the active list without deleting it.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
        },
        required: ['bundleId'],
      },
      handler: handleTool((args) => apiClient.archiveBundle(args.bundleId)),
    },

    restore_bundle: {
      description: 'Restore an archived bundle to make it active again.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: { type: 'string', description: 'Bundle ID' },
        },
        required: ['bundleId'],
      },
      handler: handleTool((args) => apiClient.restoreBundle(args.bundleId)),
    },
  };
}
