/**
 * Bundle Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';

export function registerBundleTools(apiClient: ApiClient) {
  return {
    /**
     * Create bundle
     */
    create_bundle: {
      description: 'Create a new bundle to organize and group multiple short URLs together.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Bundle name',
          },
          description: {
            type: 'string',
            description: 'Bundle description (optional)',
          },
          color: {
            type: 'string',
            description: 'Bundle color code (optional, e.g., #FF5733)',
          },
          icon: {
            type: 'string',
            description: 'Bundle icon name (optional)',
          },
          urlIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of URL IDs to add to the bundle (optional)',
          },
        },
        required: ['name'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.createBundle(args);
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
     * List all bundles
     */
    list_bundles: {
      description: 'List all bundles with pagination and filtering options.',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            description: 'Page number (optional, defaults to 1)',
            default: 1,
          },
          pageSize: {
            type: 'number',
            description: 'Number of bundles per page (optional, defaults to 10)',
            default: 10,
          },
          status: {
            type: 'string',
            description: 'Filter by status (optional, ACTIVE or ARCHIVED)',
          },
          search: {
            type: 'string',
            description: 'Search by bundle name (optional)',
          },
        },
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.listBundles(args);
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
     * Get bundle details
     */
    get_bundle: {
      description: 'Get detailed information about a specific bundle, including its URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Bundle ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getBundle(args.id);
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
     * Update bundle
     */
    update_bundle: {
      description: 'Update bundle information including name, description, color, icon, or status.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Bundle ID',
          },
          name: {
            type: 'string',
            description: 'New bundle name (optional)',
          },
          description: {
            type: 'string',
            description: 'New description (optional)',
          },
          color: {
            type: 'string',
            description: 'New color code (optional)',
          },
          icon: {
            type: 'string',
            description: 'New icon name (optional)',
          },
          status: {
            type: 'string',
            description: 'New status (optional, ACTIVE or ARCHIVED)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          const { id, ...updateData } = args;
          const result = await apiClient.updateBundle(id, updateData);
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
     * Delete bundle
     */
    delete_bundle: {
      description: 'Delete a bundle. This does not delete the URLs within the bundle.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Bundle ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        try {
          await apiClient.deleteBundle(args.id);
          return {
            content: [
              {
                type: 'text',
                text: `Bundle ${args.id} has been successfully deleted`,
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
     * Add URL to bundle
     */
    add_url_to_bundle: {
      description: 'Add a single short URL to an existing bundle.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
          urlId: {
            type: 'string',
            description: 'URL ID to add',
          },
        },
        required: ['bundleId', 'urlId'],
      },
      handler: async (args: any) => {
        try {
          const { bundleId, urlId } = args;
          const result = await apiClient.addUrlToBundle(bundleId, { urlId });
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
     * Add multiple URLs to bundle
     */
    add_multiple_urls_to_bundle: {
      description: 'Add multiple short URLs to an existing bundle at once.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
          urlIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of URL IDs to add',
          },
        },
        required: ['bundleId', 'urlIds'],
      },
      handler: async (args: any) => {
        try {
          const { bundleId, urlIds } = args;
          const result = await apiClient.addMultipleUrlsToBundle(bundleId, {
            urlIds,
          });
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
     * Remove URL from bundle
     */
    remove_url_from_bundle: {
      description: 'Remove a short URL from a bundle. This does not delete the URL itself.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
          urlId: {
            type: 'string',
            description: 'URL ID to remove',
          },
        },
        required: ['bundleId', 'urlId'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.removeUrlFromBundle(
            args.bundleId,
            args.urlId
          );
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
     * Update URL order in bundle
     */
    update_url_order_in_bundle: {
      description: 'Update the display order of a URL within a bundle.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
          urlId: {
            type: 'string',
            description: 'URL ID',
          },
          order: {
            type: 'number',
            description: 'New order position (0-based index)',
          },
        },
        required: ['bundleId', 'urlId', 'order'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.updateUrlOrder(
            args.bundleId,
            args.urlId,
            args.order
          );
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
     * Get bundle statistics
     */
    get_bundle_stats: {
      description: 'Get statistics for a bundle including total clicks, URL count, and top performing URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
        },
        required: ['bundleId'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getBundleStats(args.bundleId);
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
     * Archive bundle
     */
    archive_bundle: {
      description: 'Archive a bundle to hide it from the active list without deleting it.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
        },
        required: ['bundleId'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.archiveBundle(args.bundleId);
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
     * Restore bundle
     */
    restore_bundle: {
      description: 'Restore an archived bundle to make it active again.',
      inputSchema: {
        type: 'object',
        properties: {
          bundleId: {
            type: 'string',
            description: 'Bundle ID',
          },
        },
        required: ['bundleId'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.restoreBundle(args.bundleId);
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
