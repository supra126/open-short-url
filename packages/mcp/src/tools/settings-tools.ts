/**
 * System Settings MCP Tools (Admin)
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerSettingsTools(apiClient: ApiClient) {
  return {
    get_system_settings: {
      description: 'Get all system settings (admin only). Common settings: allowRegistration, defaultSlugLength, requireEmailVerification, enableAnalytics.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: handleTool(() => apiClient.getSystemSettings()),
    },

    get_system_setting: {
      description: 'Get a specific system setting by key (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Setting key (e.g., allowRegistration, defaultSlugLength)' },
        },
        required: ['key'],
      },
      handler: handleTool((args) => apiClient.getSystemSetting(args.key)),
    },

    update_system_setting: {
      description: 'Update or create a system setting (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Setting key' },
          value: { description: 'Setting value (any JSON-compatible value: string, number, boolean, object, array)' },
          description: { type: 'string', description: 'Setting description (optional, max 500 characters)' },
        },
        required: ['key', 'value'],
      },
      handler: handleTool((args) => {
        const { key, ...data } = args;
        return apiClient.updateSystemSetting(key, data);
      }),
    },

    delete_system_setting: {
      description: '[DESTRUCTIVE] Delete a system setting, reverting it to its default value (admin only). Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Setting key to delete' },
        },
        required: ['key'],
      },
      handler: handleTool(
        (args) => apiClient.deleteSystemSetting(args.key),
        (args) => `System setting "${args.key}" has been successfully deleted`
      ),
    },
  };
}
