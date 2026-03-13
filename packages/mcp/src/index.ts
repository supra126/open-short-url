#!/usr/bin/env node

/**
 * Open Short URL - MCP Server
 * Model Context Protocol Server for managing short URLs via AI assistants
 *
 * Supports two transport modes:
 *   - stdio (default): For CLI and IDE integrations (e.g., Claude Desktop)
 *   - http: Streamable HTTP for remote access and containerized deployments
 *
 * Environment variables:
 *   - API_URL (required): Backend API URL
 *   - API_KEY (required): API key for authentication
 *   - MCP_TRANSPORT: "stdio" (default) or "http"
 *   - MCP_PORT: HTTP port (default: 3200, only for http transport)
 *   - MCP_HOST: HTTP bind address (default: 0.0.0.0, only for http transport)
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
import { registerRoutingTools } from './tools/routing-tools.js';
import { registerWebhookTools } from './tools/webhook-tools.js';
import { registerUserTools } from './tools/user-tools.js';
import { registerApiKeyTools } from './tools/api-key-tools.js';
import { registerOidcTools } from './tools/oidc-tools.js';
import { registerSettingsTools } from './tools/settings-tools.js';
import { registerAuditLogTools } from './tools/audit-log-tools.js';

// Export tool registration functions for use in other packages
export {
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
};
export { ApiClient } from './utils/api-client.js';
export { handleTool } from './utils/tool-handler.js';
export type * from './types/api.js';

/**
 * Get configuration from environment variables
 */
function getConfig() {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.API_KEY;
  const transport = (process.env.MCP_TRANSPORT || 'stdio') as 'stdio' | 'http';
  const port = parseInt(process.env.MCP_PORT || '3200', 10);
  const host = process.env.MCP_HOST || '0.0.0.0';

  if (!apiUrl) {
    throw new Error('Environment variable API_URL is required (e.g., https://your-backend.com)');
  }

  if (!apiKey) {
    throw new Error('Environment variable API_KEY is required (generate one in your backend system)');
  }

  return { apiUrl, apiKey, transport, port, host };
}

/**
 * Create and configure the MCP server with all tools
 */
function createMcpServer(apiClient: ApiClient) {
  const server = new Server(
    {
      name: 'open-short-url-mcp',
      version: '0.3.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register all tools
  const allTools = {
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

  return server;
}

/**
 * Start with stdio transport (for CLI / IDE integrations)
 */
async function startStdio(server: Server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

/**
 * Start with Streamable HTTP transport (for remote / containerized access)
 */
async function startHttp(apiClient: ApiClient, host: string, port: number) {
  // Dynamic imports to avoid bundling express when using stdio
  const { createMcpExpressApp } = await import(
    '@modelcontextprotocol/sdk/server/express.js'
  );
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  );
  const { isInitializeRequest } = await import(
    '@modelcontextprotocol/sdk/types.js'
  );
  const { randomUUID } = await import('node:crypto');

  const app = createMcpExpressApp({ host });

  // Session management for stateful connections
  const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
  const sessions = new Map<string, { server: Server; transport: InstanceType<typeof StreamableHTTPServerTransport>; lastSeen: number }>();

  // Periodic cleanup of stale sessions (unref to not block process exit)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastSeen > SESSION_TTL_MS) {
        session.transport.close().catch(() => {});
        sessions.delete(id);
      }
    }
  }, 5 * 60 * 1000);
  cleanupInterval.unref();

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', transport: 'streamable-http', tools: 77 });
  });

  // POST /mcp — handle JSON-RPC requests
  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Reuse existing session
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      session.lastSeen = Date.now();
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    // New session (must be initialize request)
    if (!sessionId && isInitializeRequest(req.body)) {
      const server = createMcpServer(apiClient);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { server, transport, lastSeen: Date.now() });
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or missing session. Send an initialize request first.' },
      id: null,
    });
  });

  // GET /mcp — SSE stream for server-initiated notifications
  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      session.lastSeen = Date.now();
      await session.transport.handleRequest(req, res);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid or missing session' },
        id: null,
      });
    }
  });

  // DELETE /mcp — close session
  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.close();
      sessions.delete(sessionId);
      res.status(204).end();
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid or missing session' },
        id: null,
      });
    }
  });

  app.listen(port, host, () => {
    console.error(`MCP Server running on http://${host}:${port}/mcp`);
  });
}

/**
 * Main function
 */
async function main() {
  try {
    const { apiUrl, apiKey, transport, port, host } = getConfig();
    const apiClient = new ApiClient(apiUrl, apiKey);

    if (transport === 'http') {
      await startHttp(apiClient, host, port);
    } else {
      const server = createMcpServer(apiClient);
      await startStdio(server);
    }

    // Graceful shutdown
    const shutdown = async () => {
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Execute main function only when run directly (not when imported as a library)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
