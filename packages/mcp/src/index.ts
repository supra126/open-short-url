#!/usr/bin/env node

/**
 * Open Short URL - MCP Server
 * Model Context Protocol Server for managing short URLs via AI assistants
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ApiClient } from './utils/api-client.js';
import { registerUrlTools } from './tools/url-tools.js';
import { registerAnalyticsTools } from './tools/analytics-tools.js';
import { registerVariantTools } from './tools/variant-tools.js';
import { registerBundleTools } from './tools/bundle-tools.js';

// Export tool registration functions for use in other packages
export { registerUrlTools, registerAnalyticsTools, registerVariantTools, registerBundleTools };
export { ApiClient } from './utils/api-client.js';

/**
 * Get configuration from environment variables
 */
function getConfig() {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.API_KEY;

  if (!apiUrl) {
    throw new Error('Environment variable API_URL is required (e.g., https://your-backend.com)');
  }

  if (!apiKey) {
    throw new Error('Environment variable API_KEY is required (generate one in your backend system)');
  }

  return { apiUrl, apiKey };
}

/**
 * Main function
 */
async function main() {
  try {
    // Get configuration
    const { apiUrl, apiKey } = getConfig();

    // Create API client
    const apiClient = new ApiClient(apiUrl, apiKey);

    // Create MCP Server
    const server = new Server(
      {
        name: 'open-short-url-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register all tools
    const urlTools = registerUrlTools(apiClient);
    const analyticsTools = registerAnalyticsTools(apiClient);
    const variantTools = registerVariantTools(apiClient);
    const bundleTools = registerBundleTools(apiClient);

    const allTools = {
      ...urlTools,
      ...analyticsTools,
      ...variantTools,
      ...bundleTools,
    };

    // Handle list_tools requests
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.entries(allTools).map(([name, tool]) => ({
          name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle call_tool requests
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = allTools[toolName as keyof typeof allTools];

      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      return await tool.handler(request.params.arguments);
    });

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server and transport
    await server.connect(transport);

    // Error handling
    process.on('SIGINT', async () => {
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Execute main function only when run directly (not when imported as a library)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
