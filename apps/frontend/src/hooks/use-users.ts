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
  UserQueryParams,
};

// Type aliases for backward compatibility (exported for consumers)
export type User = UserResponseDto;
export type UserListResponse = UserListResponseDto;

// UserRole enum for backward compatibility
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// Query Keys (exported for external cache management)
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getUsers(params: UserQueryParams): Promise<UserListResponse> {
  const queryString = buildQueryParams(params);
  return apiClient.get<UserListResponse>(
    `/api/users${queryString ? `?${queryString}` : ''}`,
  );
}

async function getUserById(id: string): Promise<User> {
  return apiClient.get<User>(`/api/users/${id}`);
}

async function updateUserRole(
  id: string,
  data: UpdateUserRoleDto,
): Promise<User> {
  return apiClient.patch<User>(`/api/users/${id}/role`, data);
}

async function updateUserStatus(
  id: string,
  data: UpdateUserStatusDto,
): Promise<User> {
  return apiClient.patch<User>(`/api/users/${id}/status`, data);
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

async function createUser(data: CreateUserDto): Promise<User> {
  return apiClient.post<User>('/api/users', data);
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
      // Invalidate all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
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
      // Invalidate all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
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
    onSuccess: () => {
      // Invalidate all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
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
      // Invalidate all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
  });
}
