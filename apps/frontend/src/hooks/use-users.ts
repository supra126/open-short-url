/**
 * User Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  ResetPasswordDto,
  UpdateUserNameDto,
  OidcAccountResponseDto,
  UserQueryParams,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type {
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  ResetPasswordDto,
  UpdateUserNameDto,
  OidcAccountResponseDto,
  UserQueryParams,
};

// Runtime constants for user roles (used as values in JSX)
export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Query Keys (exported for external cache management)
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  oidcAccounts: (id: string) => [...userKeys.detail(id), 'oidc-accounts'] as const,
};

// ==================== API Functions ====================

async function getUsers(params: UserQueryParams): Promise<UserListResponseDto> {
  const queryString = buildQueryParams(params);
  return apiClient.get<UserListResponseDto>(
    `/api/users${queryString ? `?${queryString}` : ''}`,
  );
}

async function getUserById(id: string): Promise<UserResponseDto> {
  return apiClient.get<UserResponseDto>(`/api/users/${id}`);
}

async function updateUserRole(
  id: string,
  data: UpdateUserRoleDto,
): Promise<UserResponseDto> {
  return apiClient.patch<UserResponseDto>(`/api/users/${id}/role`, data);
}

async function updateUserStatus(
  id: string,
  data: UpdateUserStatusDto,
): Promise<UserResponseDto> {
  return apiClient.patch<UserResponseDto>(`/api/users/${id}/status`, data);
}

async function deleteUser(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/users/${id}`);
}

async function resetUserPassword(
  id: string,
  data: ResetPasswordDto,
): Promise<void> {
  return apiClient.patch<void>(`/api/users/${id}/reset-password`, data);
}

async function createUser(data: CreateUserDto): Promise<UserResponseDto> {
  return apiClient.post<UserResponseDto>('/api/users', data);
}

async function updateUserName(
  id: string,
  data: UpdateUserNameDto,
): Promise<UserResponseDto> {
  return apiClient.patch<UserResponseDto>(`/api/users/${id}/name`, data);
}

async function adminDisable2FA(id: string): Promise<UserResponseDto> {
  return apiClient.patch<UserResponseDto>(`/api/users/${id}/2fa`, {});
}

async function getUserOidcAccounts(id: string): Promise<OidcAccountResponseDto[]> {
  return apiClient.get<OidcAccountResponseDto[]>(`/api/users/${id}/oidc-accounts`);
}

async function deleteUserOidcAccount(
  userId: string,
  accountId: string,
): Promise<void> {
  return apiClient.delete<void>(`/api/users/${userId}/oidc-accounts/${accountId}`);
}

// ==================== Hooks ====================

/**
 * Get user list
 */
export function useUsers(params: UserQueryParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get user details
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
    ...QUERY_CONFIG.DETAIL,
  });
}

/**
 * Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRoleDto }) =>
      updateUserRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });
    },
  });
}

/**
 * Update user account status
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserStatusDto }) =>
      updateUserStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });
    },
  });
}

/**
 * Delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });
      queryClient.removeQueries({
        queryKey: userKeys.detail(id),
      });
    },
  });
}

/**
 * Reset user password
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetPasswordDto }) =>
      resetUserPassword(id, data),
  });
}

/**
 * Create new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Update user name
 */
export function useUpdateUserName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserNameDto }) =>
      updateUserName(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Admin disable 2FA
 */
export function useAdminDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDisable2FA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Get user's OIDC accounts (SSO links)
 */
export function useUserOidcAccounts(userId: string) {
  return useQuery({
    queryKey: userKeys.oidcAccounts(userId),
    queryFn: () => getUserOidcAccounts(userId),
    enabled: !!userId,
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Delete user OIDC account link
 */
export function useDeleteUserOidcAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, accountId }: { userId: string; accountId: string }) =>
      deleteUserOidcAccount(userId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
