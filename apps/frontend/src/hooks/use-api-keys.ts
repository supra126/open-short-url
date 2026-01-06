/**
 * API Keys Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  ApiKeyResponseDto,
  ApiKeyListResponseDto,
  CreateApiKeyDto,
  CreateApiKeyResponseDto,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { ApiKeyResponseDto, ApiKeyListResponseDto, CreateApiKeyDto, CreateApiKeyResponseDto };

// Query Keys (exported for external cache management)
export const apiKeysKeys = {
  all: ['api-keys'] as const,
  lists: () => [...apiKeysKeys.all, 'list'] as const,
  details: () => [...apiKeysKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeysKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getApiKeys(): Promise<ApiKeyListResponseDto> {
  return apiClient.get<ApiKeyListResponseDto>('/api/api-keys');
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
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeysKeys.lists(),
    queryFn: getApiKeys,
    ...QUERY_CONFIG.STATIC,
  });
}

/**
 * Get single API Key
 */
export function useApiKey(id: string) {
  return useQuery({
    queryKey: apiKeysKeys.detail(id),
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
        queryKey: apiKeysKeys.lists(),
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
    onSuccess: () => {
      // Invalidate list cache to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: apiKeysKeys.lists(),
      });
    },
  });
}
