/**
 * Analytics MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';

export function registerAnalyticsTools(apiClient: ApiClient) {
  return {
    /**
     * Get URL analytics
     */
    get_url_analytics: {
      description: 'Get detailed analytics data for a specific short URL, including click trends, geographic locations, device distribution, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          startDate: {
            type: 'string',
            description: 'Start date (optional, ISO 8601 format, e.g., 2025-01-01)',
          },
          endDate: {
            type: 'string',
            description: 'End date (optional, ISO 8601 format)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (optional, e.g., Asia/Taipei)',
          },
        },
        required: ['urlId'],
      },
      handler: async (args: any) => {
        try {
          const { urlId, ...params } = args;
          const result = await apiClient.getUrlAnalytics(urlId, params);
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
     * Get overview analytics
     */
    get_overview_analytics: {
      description: 'Get overall analytics data and statistics for all short URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date (optional, ISO 8601 format)',
          },
          endDate: {
            type: 'string',
            description: 'End date (optional, ISO 8601 format)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (optional, e.g., Asia/Taipei)',
          },
        },
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getOverviewAnalytics(args);
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
     * Get recent clicks
     */
    get_recent_clicks: {
      description: 'Get recent click records for a specific short URL, including visitor information and sources.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          limit: {
            type: 'number',
            description: 'Number of records to return (optional, defaults to 20, max 100)',
            default: 20,
          },
          includeBots: {
            type: 'boolean',
            description: 'Include bot traffic (optional, defaults to false)',
            default: false,
          },
        },
        required: ['urlId'],
      },
      handler: async (args: any) => {
        try {
          const { urlId, ...params } = args;
          const result = await apiClient.getRecentClicks(urlId, params);
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
     * Get bot analytics
     */
    get_bot_analytics: {
      description: 'Get bot traffic analytics data for a specific short URL.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: {
            type: 'string',
            description: 'Short URL ID',
          },
          startDate: {
            type: 'string',
            description: 'Start date (optional, ISO 8601 format)',
          },
          endDate: {
            type: 'string',
            description: 'End date (optional, ISO 8601 format)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (optional)',
          },
        },
        required: ['urlId'],
      },
      handler: async (args: any) => {
        try {
          const { urlId, ...params } = args;
          const result = await apiClient.getBotAnalytics(urlId, params);
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
     * Get user bot analytics
     */
    get_user_bot_analytics: {
      description: 'Get overall bot traffic analytics across all short URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date (optional, ISO 8601 format)',
          },
          endDate: {
            type: 'string',
            description: 'End date (optional, ISO 8601 format)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (optional)',
          },
        },
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getUserBotAnalytics(args);
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
     * Get A/B test analytics
     */
    get_ab_test_analytics: {
      description: 'Get A/B testing performance analytics for all short URLs with testing enabled.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date (optional, ISO 8601 format)',
          },
          endDate: {
            type: 'string',
            description: 'End date (optional, ISO 8601 format)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (optional)',
          },
        },
      },
      handler: async (args: any) => {
        try {
          const result = await apiClient.getAbTestAnalytics(args);
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
