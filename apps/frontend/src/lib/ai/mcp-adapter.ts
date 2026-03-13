import { tool, type Tool } from 'ai';
import { z } from 'zod';
import { jsonSchemaToZod, type JSONSchema } from './json-schema-to-zod';
import {
  ApiClient,
  registerUrlTools,
  registerAnalyticsTools,
  registerVariantTools,
  registerBundleTools,
  registerRoutingTools,
  registerWebhookTools,
  registerUserTools,
  registerApiKeyTools,
  registerOidcTools,
  registerSettingsTools,
  registerAuditLogTools,
} from '@open-short-url/mcp';
import { getCookies } from './request-context';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * MCP to Vercel AI SDK Adapter
 * Automatically converts all MCP tools to Vercel AI SDK format
 * This eliminates the need to manually define tools in the frontend
 */

interface MCPContentItem {
  type: string;
  text?: string;
}

interface MCPResult {
  content?: MCPContentItem[];
  isError?: boolean;
}

interface MCPTool {
  description: string;
  inputSchema: JSONSchema;
  handler: (args: Record<string, unknown>) => Promise<MCPResult>;
}

/**
 * Register all MCP tools with the given API client
 */
function registerAllTools(apiClient: ApiClient): Record<string, MCPTool> {
  return {
    ...registerUrlTools(apiClient),
    ...registerAnalyticsTools(apiClient),
    ...registerVariantTools(apiClient),
    ...registerBundleTools(apiClient),
    ...registerRoutingTools(apiClient),
    ...registerWebhookTools(apiClient),
    ...registerUserTools(apiClient),
    ...registerApiKeyTools(apiClient),
    ...registerOidcTools(apiClient),
    ...registerSettingsTools(apiClient),
    ...registerAuditLogTools(apiClient),
  } as Record<string, MCPTool>;
}

/**
 * Convert a single MCP tool to Vercel AI SDK format
 */
function convertMCPTool(toolName: string, mcpTool: MCPTool): Tool {
  // Create the zod schema from JSON Schema
  const zodInputSchema = jsonSchemaToZod(mcpTool.inputSchema) as z.ZodObject<Record<string, z.ZodTypeAny>>;

  return tool({
    description: mcpTool.description,
    inputSchema: zodInputSchema,
    execute: async (params) => {
      try {
        // Get cookies from request context
        const cookies = getCookies();

        // Get backend URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

        // Create MCP API Client with cookie authentication
        const apiClient = new ApiClient(apiUrl, { cookies });

        // Register tools with authenticated client and look up by name
        const allMCPTools = registerAllTools(apiClient);
        const matchingTool = allMCPTools[toolName];

        if (!matchingTool) {
          throw new Error(`Tool not found: ${toolName}`);
        }

        // Execute the MCP tool handler
        const result = await matchingTool.handler(params);

        // Convert MCP result format to Vercel AI SDK format
        if (result.content) {
          // MCP format: { content: [{ type: 'text', text: '...' }] }
          const textContent = result.content
            .filter((c: MCPContentItem) => c.type === 'text')
            .map((c: MCPContentItem) => c.text ?? '')
            .join('\n');

          try {
            // Try to parse as JSON for structured data
            const parsed: unknown = JSON.parse(textContent);
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
      } catch (error: unknown) {
        ErrorHandler.log(error, 'MCP Tool Execution');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: errorMessage,
          message: `Error: ${errorMessage}`,
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
  const allMCPTools = registerAllTools(dummyClient);

  // Convert all MCP tools to Vercel AI SDK format
  const convertedTools: Record<string, Tool> = {};

  for (const [name, mcpTool] of Object.entries(allMCPTools)) {
    // Convert snake_case to camelCase for better JS naming
    const camelCaseName = name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    convertedTools[camelCaseName] = convertMCPTool(name, mcpTool);
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
