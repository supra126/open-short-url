/**
 * OIDC Provider Admin Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  OidcProviderResponseDto,
  CreateOidcProviderDto,
  UpdateOidcProviderDto,
  SystemSettingsResponseDto,
} from '@/lib/api/schemas';

// Re-export types for consumers
export type {
  OidcProviderResponseDto,
  CreateOidcProviderDto,
  UpdateOidcProviderDto,
  SystemSettingsResponseDto,
};

// ==================== Query Keys ====================

export const oidcAdminKeys = {
  all: ['oidc-admin'] as const,
  lists: () => [...oidcAdminKeys.all, 'list'] as const,
  details: () => [...oidcAdminKeys.all, 'detail'] as const,
  detail: (slug: string) => [...oidcAdminKeys.details(), slug] as const,
  ssoEnforce: () => [...oidcAdminKeys.all, 'sso-enforce'] as const,
};

// ==================== API Functions ====================

async function getOidcProviders(): Promise<OidcProviderResponseDto[]> {
  return apiClient.get<OidcProviderResponseDto[]>('/api/admin/oidc-providers');
}

async function getOidcProvider(slug: string): Promise<OidcProviderResponseDto> {
  return apiClient.get<OidcProviderResponseDto>(`/api/admin/oidc-providers/${slug}`);
}

async function createOidcProvider(data: CreateOidcProviderDto): Promise<OidcProviderResponseDto> {
  return apiClient.post<OidcProviderResponseDto>('/api/admin/oidc-providers', data);
}

async function updateOidcProvider(slug: string, data: UpdateOidcProviderDto): Promise<OidcProviderResponseDto> {
  return apiClient.put<OidcProviderResponseDto>(`/api/admin/oidc-providers/${slug}`, data);
}

async function deleteOidcProvider(slug: string): Promise<void> {
  return apiClient.delete<void>(`/api/admin/oidc-providers/${slug}`);
}

async function getSsoEnforceSetting(): Promise<SystemSettingsResponseDto | null> {
  return apiClient.get<SystemSettingsResponseDto | null>('/api/settings/system/sso_enforce');
}

async function updateSsoEnforceSetting(enabled: boolean): Promise<SystemSettingsResponseDto> {
  return apiClient.put<SystemSettingsResponseDto>('/api/settings/system/sso_enforce', {
    value: { enabled },
    description: 'Enforce SSO login (block password login when active providers exist)',
  });
}

// ==================== Hooks ====================

export function useOidcAdminProviders() {
  return useQuery({
    queryKey: oidcAdminKeys.lists(),
    queryFn: getOidcProviders,
    ...QUERY_CONFIG.STATIC,
  });
}

export function useOidcAdminProvider(slug: string) {
  return useQuery({
    queryKey: oidcAdminKeys.detail(slug),
    queryFn: () => getOidcProvider(slug),
    enabled: !!slug,
    ...QUERY_CONFIG.STATIC,
  });
}

export function useCreateOidcProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOidcProviderDto) => createOidcProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oidcAdminKeys.lists() });
    },
  });
}

export function useUpdateOidcProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateOidcProviderDto }) =>
      updateOidcProvider(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oidcAdminKeys.lists() });
    },
  });
}

export function useDeleteOidcProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteOidcProvider(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oidcAdminKeys.lists() });
    },
  });
}

export function useSsoEnforceSetting() {
  return useQuery({
    queryKey: oidcAdminKeys.ssoEnforce(),
    queryFn: getSsoEnforceSetting,
    ...QUERY_CONFIG.STATIC,
  });
}

export function useUpdateSsoEnforce() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => updateSsoEnforceSetting(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(oidcAdminKeys.ssoEnforce(), data);
    },
  });
}
