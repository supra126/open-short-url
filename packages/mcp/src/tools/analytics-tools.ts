/**
 * Analytics MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerAnalyticsTools(apiClient: ApiClient) {
  return {
    get_url_analytics: {
      description: 'Get detailed analytics data for a specific short URL, including click trends, geographic locations, device distribution, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format, e.g., 2025-01-01)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional, IANA format, e.g., Asia/Taipei)' },
        },
        required: ['urlId'],
      },
      handler: handleTool((args) => {
        const { urlId, ...params } = args;
        return apiClient.getUrlAnalytics(urlId, params);
      }),
    },

    get_overview_analytics: {
      description: 'Get overall analytics data and statistics for all short URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional, IANA format, e.g., Asia/Taipei)' },
        },
      },
      handler: handleTool((args) => apiClient.getOverviewAnalytics(args)),
    },

    get_top_performing_urls: {
      description: 'Get top performing URLs ranked by click count within a time range.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of top URLs to return (optional, defaults to 5)', default: 5 },
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional, IANA format)' },
        },
      },
      handler: handleTool((args) => apiClient.getTopPerformingUrls(args)),
    },

    get_recent_clicks: {
      description: 'Get recent click records for a specific short URL, including visitor information and sources.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          limit: { type: 'number', description: 'Number of records to return (optional, defaults to 20, max 100)', default: 20 },
          includeBots: { type: 'boolean', description: 'Include bot traffic (optional, defaults to false)', default: false },
        },
        required: ['urlId'],
      },
      handler: handleTool((args) => {
        const { urlId, ...params } = args;
        return apiClient.getRecentClicks(urlId, params);
      }),
    },

    get_bot_analytics: {
      description: 'Get bot traffic analytics data for a specific short URL.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional)' },
        },
        required: ['urlId'],
      },
      handler: handleTool((args) => {
        const { urlId, ...params } = args;
        return apiClient.getBotAnalytics(urlId, params);
      }),
    },

    get_user_bot_analytics: {
      description: 'Get overall bot traffic analytics across all short URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional)' },
        },
      },
      handler: handleTool((args) => apiClient.getUserBotAnalytics(args)),
    },

    get_ab_test_analytics: {
      description: 'Get A/B testing performance analytics for all short URLs with testing enabled.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional)' },
        },
      },
      handler: handleTool((args) => apiClient.getAbTestAnalytics(args)),
    },

    get_routing_analytics: {
      description: 'Get smart routing statistics for a specific short URL, including rule match counts and trends.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          startDate: { type: 'string', description: 'Start date (optional, ISO 8601 format)' },
          endDate: { type: 'string', description: 'End date (optional, ISO 8601 format)' },
          timezone: { type: 'string', description: 'Timezone (optional)' },
        },
        required: ['urlId'],
      },
      handler: handleTool((args) => {
        const { urlId, ...params } = args;
        return apiClient.getRoutingAnalytics(urlId, params);
      }),
    },
  };
}
