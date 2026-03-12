/**
 * API Keys Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  ApiKeyResponseDto,
  ApiKeyListResponseDto,
  CreateApiKeyDto,
  CreateApiKeyResponseDto,
  PaginationParams,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { ApiKeyResponseDto, ApiKeyListResponseDto, CreateApiKeyDto, CreateApiKeyResponseDto, PaginationParams };

// Query Keys (exported for external cache management)
export const apiKeyKeys = {
  all: ['api-keys'] as const,
  lists: () => [...apiKeyKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...apiKeyKeys.lists(), params] as const,
  details: () => [...apiKeyKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeyKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getApiKeys(params?: PaginationParams): Promise<ApiKeyListResponseDto> {
  const query = params ? buildQueryParams(params) : '';
  return apiClient.get<ApiKeyListResponseDto>(`/api/api-keys${query ? `?${query}` : ''}`);
}

async function getApiKey(id: string): Promise<ApiKeyResponseDto> {
  return apiClient.get<ApiKeyResponseDto>(`/api/api-keys/${id}`);
}

async function createApiKey(
  data: CreateApiKeyDto,
): Promise<CreateApiKeyResponseDto> {
  return apiClient.post<CreateApiKeyResponseDto>('/api/api-keys', data);
}

async function deleteApiKey(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/api-keys/${id}`);
}

// ==================== Hooks ====================

/**
 * Get all API Keys
 */
export function useApiKeys(params?: PaginationParams) {
  return useQuery({
    queryKey: apiKeyKeys.list(params),
    queryFn: () => getApiKeys(params),
    ...QUERY_CONFIG.STATIC,
  });
}

/**
 * Get single API Key
 */
export function useApiKey(id: string) {
  return useQuery({
    queryKey: apiKeyKeys.detail(id),
    queryFn: () => getApiKey(id),
    enabled: !!id,
    ...QUERY_CONFIG.STATIC,
  });
}

/**
 * Create API Key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiKeyDto) => createApiKey(data),
    onSuccess: () => {
      // Invalidate list cache to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: apiKeyKeys.lists(),
      });
    },
  });
}

/**
 * Delete API Key
 */
export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      queryClient.removeQueries({ queryKey: apiKeyKeys.detail(id) });
    },
  });
}
