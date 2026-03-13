/**
 * OIDC Provider Management MCP Tools (Admin)
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerOidcTools(apiClient: ApiClient) {
  return {
    list_oidc_providers: {
      description: 'List all configured OIDC/SSO identity providers (admin only).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: handleTool(() => apiClient.listOidcProviders()),
    },

    create_oidc_provider: {
      description: 'Create a new OIDC/SSO identity provider for single sign-on (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Provider display name (1-100 characters)' },
          slug: { type: 'string', description: 'URL-friendly identifier (lowercase, numbers, hyphens only; 1-50 characters)' },
          discoveryUrl: { type: 'string', description: 'OIDC Discovery URL (e.g., https://accounts.google.com/.well-known/openid-configuration)' },
          clientId: { type: 'string', description: 'OAuth2 Client ID' },
          clientSecret: { type: 'string', description: 'OAuth2 Client Secret' },
          scopes: { type: 'string', description: 'OAuth2 scopes (optional, defaults to "openid email profile")' },
          isActive: { type: 'boolean', description: 'Enable the provider (optional, defaults to true)' },
        },
        required: ['name', 'slug', 'discoveryUrl', 'clientId', 'clientSecret'],
      },
      handler: handleTool((args) => apiClient.createOidcProvider(args)),
    },

    get_oidc_provider: {
      description: 'Get detailed information about a specific OIDC provider by slug (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Provider slug' },
        },
        required: ['slug'],
      },
      handler: handleTool((args) => apiClient.getOidcProvider(args.slug)),
    },

    update_oidc_provider: {
      description: 'Update an OIDC provider configuration (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Provider slug' },
          name: { type: 'string', description: 'New display name (optional)' },
          discoveryUrl: { type: 'string', description: 'New discovery URL (optional)' },
          clientId: { type: 'string', description: 'New client ID (optional)' },
          clientSecret: { type: 'string', description: 'New client secret (optional)' },
          scopes: { type: 'string', description: 'New scopes (optional)' },
          isActive: { type: 'boolean', description: 'Enable/disable (optional)' },
        },
        required: ['slug'],
      },
      handler: handleTool((args) => {
        const { slug, ...data } = args;
        return apiClient.updateOidcProvider(slug, data);
      }),
    },

    delete_oidc_provider: {
      description: '[DESTRUCTIVE] Delete an OIDC provider. Users linked to this provider will need to use other login methods (admin only). Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Provider slug' },
        },
        required: ['slug'],
      },
      handler: handleTool(
        (args) => apiClient.deleteOidcProvider(args.slug),
        (args) => `OIDC provider "${args.slug}" has been successfully deleted`
      ),
    },
  };
}
