/**
 * User Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ==================== Types ====================

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface UpdateUserStatusDto {
  isActive: boolean;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

// ==================== Query Keys ====================

const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (query: UserListQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getUsers(query: UserListQuery): Promise<UserListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page.toString());
  if (query.pageSize) params.append('pageSize', query.pageSize.toString());
  if (query.search) params.append('search', query.search);
  if (query.role) params.append('role', query.role);
  if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());

  const queryString = params.toString();
  const url = `/api/users${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<UserListResponse>(url);
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
export function useUsers(query: UserListQuery = {}) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => getUsers(query),
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes - Keep cache for navigation
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
      // Invalidate and refetch all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
        refetchType: 'active'
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
      // Invalidate and refetch all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
        refetchType: 'active'
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
      // Invalidate and refetch all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
        refetchType: 'active'
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
      // Invalidate and refetch all user queries
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
        refetchType: 'active'
      });
    },
  });
}
