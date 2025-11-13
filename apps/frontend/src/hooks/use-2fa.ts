/**
 * Two-Factor Authentication Hooks
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { authKeys } from '@/hooks/use-auth';
import type {
  Verify2FADto,
  Disable2FADto,
  Setup2FAResponse,
} from '@/types/api';

// ==================== API Functions ====================

async function setup2FA(): Promise<Setup2FAResponse> {
  return apiClient.post<Setup2FAResponse>('/api/auth/2fa/setup', {});
}

async function enable2FA(data: Verify2FADto): Promise<void> {
  return apiClient.post<void>('/api/auth/2fa/enable', data);
}

async function disable2FA(data: Disable2FADto): Promise<void> {
  return apiClient.post<void>('/api/auth/2fa/disable', data);
}

// ==================== Hooks ====================

/**
 * Setup two-factor authentication (get QR code)
 */
export function useSetup2FA() {
  return useMutation({
    mutationFn: setup2FA,
  });
}

/**
 * Enable two-factor authentication
 */
export function useEnable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Verify2FADto) => enable2FA(data),
    onSuccess: () => {
      // Re-fetch user information to update 2FA status
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * Disable two-factor authentication
 */
export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Disable2FADto) => disable2FA(data),
    onSuccess: () => {
      // Re-fetch user information to update 2FA status
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
