/**
 * User Management MCP Tools (Admin)
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

export function registerUserTools(apiClient: ApiClient) {
  return {
    create_user: {
      description: 'Create a new user account (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email address' },
          password: {
            type: 'string',
            description: 'User password (min 8 characters)',
          },
          name: { type: 'string', description: 'User display name (optional)' },
          role: {
            type: 'string',
            enum: ['ADMIN', 'USER'],
            description: 'User role (optional, defaults to USER)',
          },
        },
        required: ['email', 'password'],
      },
      handler: handleTool((args) => apiClient.createUser(args)),
    },

    list_users: {
      description:
        'List all users with pagination, search, and filtering (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            description: 'Page number (optional, defaults to 1)',
          },
          limit: {
            type: 'number',
            description: 'Items per page (optional, defaults to 10)',
          },
          search: {
            type: 'string',
            description: 'Search by email or name (optional)',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'USER'],
            description: 'Filter by role (optional)',
          },
          isActive: {
            type: 'boolean',
            description: 'Filter by active status (optional)',
          },
          sortBy: { type: 'string', description: 'Sort field (optional)' },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort direction (optional)',
          },
        },
      },
      handler: handleTool((args) => apiClient.listUsers(args)),
    },

    get_user: {
      description:
        'Get detailed information about a specific user (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.getUser(args.id)),
    },

    update_user_role: {
      description: "Change a user's role between ADMIN and USER (admin only).",
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          role: {
            type: 'string',
            enum: ['ADMIN', 'USER'],
            description: 'New role',
          },
        },
        required: ['id', 'role'],
      },
      handler: handleTool((args) =>
        apiClient.updateUserRole(args.id, { role: args.role })
      ),
    },

    update_user_status: {
      description: 'Activate or deactivate a user account (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          isActive: {
            type: 'boolean',
            description: 'Set to true to activate, false to deactivate',
          },
        },
        required: ['id', 'isActive'],
      },
      handler: handleTool((args) =>
        apiClient.updateUserStatus(args.id, { isActive: args.isActive })
      ),
    },

    delete_user: {
      description:
        '[DESTRUCTIVE] Delete a user account and all associated data (admin only). This action is irreversible. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
        },
        required: ['id'],
      },
      handler: handleTool(
        (args) => apiClient.deleteUser(args.id),
        (args) => `User ${args.id} has been successfully deleted`
      ),
    },

    reset_user_password: {
      description:
        "[DESTRUCTIVE] Reset a user's password (admin only). The user will need to use the new password to log in. Always confirm with the user before executing. Do NOT display the new password in chat.",
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          newPassword: {
            type: 'string',
            description: 'New password (min 8 characters)',
          },
        },
        required: ['id', 'newPassword'],
      },
      handler: handleTool(
        (args) =>
          apiClient.resetUserPassword(args.id, {
            newPassword: args.newPassword,
          }),
        (args) => `Password for user ${args.id} has been successfully reset`
      ),
    },

    update_user_name: {
      description: "Update a user's display name (admin only).",
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          name: {
            type: 'string',
            description: 'New display name (max 100 characters, omit to clear)',
          },
        },
        required: ['id'],
      },
      handler: handleTool((args) => {
        const { id, ...data } = args;
        return apiClient.updateUserName(id, data);
      }),
    },

    disable_user_2fa: {
      description:
        '[DESTRUCTIVE] Disable two-factor authentication for a user (admin only). Use when a user loses their 2FA device. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
        },
        required: ['id'],
      },
      handler: handleTool(
        (args) => apiClient.disableUser2FA(args.id),
        (args) => `Two-factor authentication disabled for user ${args.id}`
      ),
    },

    get_user_oidc_accounts: {
      description: 'Get all linked OIDC/SSO accounts for a user (admin only).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
        },
        required: ['id'],
      },
      handler: handleTool((args) => apiClient.getUserOidcAccounts(args.id)),
    },

    unlink_user_oidc_account: {
      description:
        '[DESTRUCTIVE] Unlink an OIDC/SSO account from a user (admin only). The user may lose SSO login access. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'User ID' },
          accountId: {
            type: 'string',
            description: 'OIDC account ID to unlink',
          },
        },
        required: ['userId', 'accountId'],
      },
      handler: handleTool(
        (args) => apiClient.unlinkUserOidcAccount(args.userId, args.accountId),
        (args) =>
          `OIDC account ${args.accountId} has been unlinked from user ${args.userId}`
      ),
    },
  };
}
