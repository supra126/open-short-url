/**
 * URL Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  CreateUrlDto,
  UpdateUrlDto,
  UrlResponseDto,
  UrlListResponseDto,
  UrlQueryParams,
  UrlStatus,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { CreateUrlDto, UpdateUrlDto, UrlResponseDto, UrlListResponseDto, UrlQueryParams, UrlStatus };

// Query Keys (exported for external cache management)
export const urlKeys = {
  all: ['urls'] as const,
  lists: () => [...urlKeys.all, 'list'] as const,
  list: (params: UrlQueryParams) => [...urlKeys.lists(), params] as const,
  details: () => [...urlKeys.all, 'detail'] as const,
  detail: (id: string) => [...urlKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getUrls(
  params: UrlQueryParams,
): Promise<UrlListResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<UrlListResponseDto>(
    `/api/urls${query ? `?${query}` : ''}`,
  );
}

async function getUrl(id: string): Promise<UrlResponseDto> {
  return apiClient.get<UrlResponseDto>(`/api/urls/${id}`);
}

async function createUrl(
  data: CreateUrlDto,
): Promise<UrlResponseDto> {
  return apiClient.post<UrlResponseDto>('/api/urls', data);
}

async function updateUrl(
  id: string,
  data: UpdateUrlDto,
): Promise<UrlResponseDto> {
  return apiClient.put<UrlResponseDto>(`/api/urls/${id}`, data);
}

async function deleteUrl(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/urls/${id}`);
}

async function generateQRCode(
  id: string,
): Promise<{ qrCode: string }> {
  return apiClient.get<{ qrCode: string }>(`/api/urls/${id}/qrcode`);
}

// ==================== Hooks ====================

/**
 * Get URL list
 */
export function useUrls(params: UrlQueryParams = {}) {
  return useQuery({
    queryKey: urlKeys.list(params),
    queryFn: () => getUrls(params),
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get single URL
 */
export function useUrl(id: string) {
  return useQuery({
    queryKey: urlKeys.detail(id),
    queryFn: () => getUrl(id),
    enabled: !!id,
    ...QUERY_CONFIG.DETAIL,
  });
}

/**
 * Create URL
 */
export function useCreateUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUrlDto) => createUrl(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlKeys.lists() });
    },
  });
}

/**
 * Update URL
 */
export function useUpdateUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUrlDto }) =>
      updateUrl(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: urlKeys.lists() });
      queryClient.invalidateQueries({ queryKey: urlKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete URL
 */
export function useDeleteUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUrl(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlKeys.lists() });
    },
  });
}

/**
 * Generate QR Code
 */
export function useGenerateQRCode() {
  return useMutation({
    mutationFn: (id: string) => generateQRCode(id),
  });
}
