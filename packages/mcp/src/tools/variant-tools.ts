/**
 * A/B Testing Variant Management MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';

export function registerVariantTools(apiClient: ApiClient) {
  return {
    /**
     * Create A/B testing variant
     */
    create_variant: {
      description: 'Create an A/B testing variant for a short URL to test different target URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          name: {
            type: 'string',
            description: 'Variant name (e.g., Variant A, Page B)',
          },
          targetUrl: {
            type: 'string',
            description: 'Target URL for this variant',
          },
          weight: {
            type: 'number',
            description: 'Traffic weight (0-100, represents the percentage of traffic this variant receives)',
            minimum: 0,
            maximum: 100,
          },
          isActive: {
            type: 'boolean',
            description: 'Enable the variant (optional, defaults to true)',
            default: true,
          },
        },
        required: ['urlId', 'name', 'targetUrl', 'weight'],
      },
      handler: async (args: any) => {
        try {
          const { urlId, ...variantData } = args;
          const result = await apiClient.createVariant(urlId, variantData);
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
     * List all variants
     */
    list_variants: {
      description: 'List all A/B testing variants for a specific short URL with statistics.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
        },
        required: ['urlId'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.listVariants(args.urlId);
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
     * Get variant details
     */
    get_variant: {
      description: 'Get detailed information about a specific A/B testing variant.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          variantId: {
            type: 'string',
            description: 'Variant ID',
          },
        },
        required: ['urlId', 'variantId'],
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getVariant(args.urlId, args.variantId);
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
     * Update variant
     */
    update_variant: {
      description: 'Update A/B testing variant settings including name, target URL, weight, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          variantId: {
            type: 'string',
            description: 'Variant ID',
          },
          name: {
            type: 'string',
            description: 'New variant name (optional)',
          },
          targetUrl: {
            type: 'string',
            description: 'New target URL (optional)',
          },
          weight: {
            type: 'number',
            description: 'New traffic weight (optional, 0-100)',
            minimum: 0,
            maximum: 100,
          },
          isActive: {
            type: 'boolean',
            description: 'Enable the variant (optional)',
          },
        },
        required: ['urlId', 'variantId'],
      },
      handler: async (args: any) => {
        try {
          const { urlId, variantId, ...updateData } = args;
          const result = await apiClient.updateVariant(
            urlId,
            variantId,
            updateData
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
     * Delete variant
     */
    delete_variant: {
      description: 'Delete a specific A/B testing variant. If this is the last variant, A/B testing will be automatically disabled for the URL.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          variantId: {
            type: 'string',
            description: 'Variant ID',
          },
        },
        required: ['urlId', 'variantId'],
      },
      handler: async (args: any) => {
        try {
          await apiClient.deleteVariant(args.urlId, args.variantId);
          return {
            content: [
              {
                type: 'text',
                text: `Variant ${args.variantId} has been successfully deleted`,
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
