/**
 * Authentication Hooks
 * Authentication via httpOnly cookies (automatically managed by browser)
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  UserResponse,
  UpdateUserDto,
  ChangePasswordDto,
} from '@/types/api';

// Query Keys
const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// ==================== API Functions ====================

async function login(data: LoginDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/api/auth/login', data);
}

async function register(data: RegisterDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/api/auth/register', data);
}

async function getCurrentUser(): Promise<UserResponse> {
  return apiClient.get<UserResponse>('/api/auth/me');
}

async function updateProfile(data: UpdateUserDto): Promise<UserResponse> {
  return apiClient.put<UserResponse>('/api/auth/me', data);
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
 * Register
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      // Update cache
      queryClient.setQueryData(authKeys.me(), data);
      // Re-fetch user information
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
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
