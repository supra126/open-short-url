/**
 * API Keys Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ApiKey,
  ApiKeyListResponse,
  CreateApiKeyDto,
  CreateApiKeyResponse,
} from '@/types/api-keys';

// Query Keys
const apiKeysKeys = {
  all: ['api-keys'] as const,
  lists: () => [...apiKeysKeys.all, 'list'] as const,
  list: () => [...apiKeysKeys.lists()] as const,
  details: () => [...apiKeysKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeysKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getApiKeys(): Promise<ApiKeyListResponse> {
  return apiClient.get<ApiKeyListResponse>('/api/api-keys');
}

async function getApiKey(id: string): Promise<ApiKey> {
  return apiClient.get<ApiKey>(`/api/api-keys/${id}`);
}

async function createApiKey(
  data: CreateApiKeyDto,
): Promise<CreateApiKeyResponse> {
  return apiClient.post<CreateApiKeyResponse>('/api/api-keys', data);
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
    queryKey: apiKeysKeys.list(),
    queryFn: () => getApiKeys(),
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes - Keep cache for navigation
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
    staleTime: 60 * 1000, // 1 minute
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
      // Invalidate and refetch list cache to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: apiKeysKeys.lists(),
        refetchType: 'active'
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
      // Invalidate and refetch list cache to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: apiKeysKeys.lists(),
        refetchType: 'active'
      });
    },
  });
}
