/**
 * Authentication Hooks
 * Authentication via httpOnly cookies (automatically managed by browser)
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  LoginDto,
  AuthResponseDto,
  UserResponseDto,
  UpdateUserDto,
  ChangePasswordDto,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { LoginDto, AuthResponseDto, UserResponseDto, UpdateUserDto, ChangePasswordDto };

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// ==================== API Functions ====================

async function login(data: LoginDto): Promise<AuthResponseDto> {
  return apiClient.post<AuthResponseDto>('/api/auth/login', data);
}

async function getCurrentUser(): Promise<UserResponseDto> {
  return apiClient.get<UserResponseDto>('/api/auth/me');
}

async function updateProfile(data: UpdateUserDto): Promise<UserResponseDto> {
  return apiClient.put<UserResponseDto>('/api/auth/me', data);
}

async function changePassword(data: ChangePasswordDto): Promise<void> {
  return apiClient.put<void>('/api/auth/password', data);
}

// ==================== Hooks ====================

/**
 * Login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Update cache (token is in httpOnly cookie, managed by browser)
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

/**
 * Get current user information
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    ...QUERY_CONFIG.STATIC,
    retry: 3,
  });
}

/**
 * Logout API function
 */
async function logout(): Promise<void> {
  return apiClient.post<void>('/api/auth/logout');
}

/**
 * Logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear all cache (cookie is cleared by backend)
      queryClient.clear();
    },
    onError: () => {
      // Clear cache even if backend logout fails
      queryClient.clear();
    },
  });
}

/**
 * Update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Update cache directly with the response
      queryClient.setQueryData(authKeys.me(), data);
    },
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
