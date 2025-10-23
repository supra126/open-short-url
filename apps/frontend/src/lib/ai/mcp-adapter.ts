import { tool } from 'ai';
import { jsonSchemaToZod } from './json-schema-to-zod';
import {
  ApiClient,
  registerUrlTools,
  registerAnalyticsTools,
  registerVariantTools,
  registerBundleTools,
} from '@open-short-url/mcp';
import { getCookies } from './request-context';

/**
 * MCP to Vercel AI SDK Adapter
 * Automatically converts all MCP tools to Vercel AI SDK format
 * This eliminates the need to manually define tools in the frontend
 */

type MCPTool = {
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
};

/**
 * Convert a single MCP tool to Vercel AI SDK format
 */
function convertMCPTool(mcpTool: MCPTool) {
  return tool({
    description: mcpTool.description,
    inputSchema: jsonSchemaToZod(mcpTool.inputSchema),
    execute: async (params: any) => {
      try {
        // Get cookies from request context
        const cookies = getCookies();

        // Get backend URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

        // Create MCP API Client with cookie authentication
        const apiClient = new ApiClient(apiUrl, { cookies });

        // Create a temporary set of tools with this client
        // We need to re-register tools with the authenticated client
        const urlTools = registerUrlTools(apiClient);
        const analyticsTools = registerAnalyticsTools(apiClient);
        const variantTools = registerVariantTools(apiClient);
        const bundleTools = registerBundleTools(apiClient);

        const allMCPTools = {
          ...urlTools,
          ...analyticsTools,
          ...variantTools,
          ...bundleTools,
        };

        // Find the matching tool by comparing descriptions
        // (since we don't have the original tool name here)
        const matchingTool = Object.values(allMCPTools).find(
          (t) => t.description === mcpTool.description
        );

        if (!matchingTool) {
          throw new Error('Tool not found');
        }

        // Execute the MCP tool handler
        const result = await matchingTool.handler(params);

        // Convert MCP result format to Vercel AI SDK format
        if (result.content) {
          // MCP format: { content: [{ type: 'text', text: '...' }] }
          const textContent = result.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n');

          try {
            // Try to parse as JSON for structured data
            const parsed = JSON.parse(textContent);
            return {
              success: !result.isError,
              data: parsed,
              message: result.isError ? 'Error occurred' : 'Success',
            };
          } catch {
            // If not JSON, return as text
            return {
              success: !result.isError,
              data: textContent,
              message: result.isError ? 'Error occurred' : 'Success',
            };
          }
        }

        // Fallback: return as-is
        return result;
      } catch (error: any) {
        console.error('MCP tool execution error:', error);
        return {
          success: false,
          error: error.message || 'Unknown error',
          message: `Error: ${error.message || 'Unknown error'}`,
        };
      }
    },
  });
}

/**
 * Create all Vercel AI SDK tools from MCP tools
 * This function automatically generates all 29 tools from the MCP package
 *
 * @returns An object containing all tools ready for use with Vercel AI SDK
 */
export function createAllMCPTools() {
  // Create a dummy API client just to get tool definitions
  // The actual client with authentication will be created during execution
  const dummyClient = new ApiClient('http://localhost:3100', { apiKey: 'dummy' });

  // Register all MCP tools
  const urlTools = registerUrlTools(dummyClient);
  const analyticsTools = registerAnalyticsTools(dummyClient);
  const variantTools = registerVariantTools(dummyClient);
  const bundleTools = registerBundleTools(dummyClient);

  const allMCPTools = {
    ...urlTools,
    ...analyticsTools,
    ...variantTools,
    ...bundleTools,
  };

  // Convert all MCP tools to Vercel AI SDK format
  const convertedTools: Record<string, any> = {};

  for (const [name, mcpTool] of Object.entries(allMCPTools)) {
    // Convert snake_case to camelCase for better JS naming
    const camelCaseName = name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    convertedTools[camelCaseName] = convertMCPTool(mcpTool);
  }

  return convertedTools;
}

/**
 * Get tool statistics
 */
export function getToolStats() {
  const tools = createAllMCPTools();
  const toolNames = Object.keys(tools);

  return {
    total: toolNames.length,
    byCategory: {
      url: toolNames.filter((n) => n.includes('Url') || n.includes('QR')).length,
      bundle: toolNames.filter((n) => n.includes('Bundle')).length,
      analytics: toolNames.filter((n) => n.includes('Analytics') || n.includes('Bot') || n.includes('Click')).length,
      variant: toolNames.filter((n) => n.includes('Variant') || n.includes('AbTest')).length,
    },
    tools: toolNames,
  };
}
