/**
 * Bundles Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  CreateBundleDto,
  UpdateBundleDto,
  BundleResponseDto,
  BundleListResponseDto,
  BundleUrlDto,
  BundleQueryParams,
  AddUrlToBundleDto,
  AddMultipleUrlsDto,
  BundleStatsDto,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type {
  CreateBundleDto,
  UpdateBundleDto,
  BundleResponseDto,
  BundleListResponseDto,
  BundleUrlDto,
  BundleQueryParams,
  AddUrlToBundleDto,
  AddMultipleUrlsDto,
  BundleStatsDto,
};

// Query Keys (exported for external cache management)
export const bundleKeys = {
  all: ['bundles'] as const,
  lists: () => [...bundleKeys.all, 'list'] as const,
  list: (params?: BundleQueryParams) => [...bundleKeys.lists(), params] as const,
  details: () => [...bundleKeys.all, 'detail'] as const,
  detail: (id: string) => [...bundleKeys.details(), id] as const,
  stats: (id: string) => [...bundleKeys.all, 'stats', id] as const,
};

// ==================== API Functions ====================

async function getBundles(params?: BundleQueryParams): Promise<BundleListResponseDto> {
  const query = params ? buildQueryParams(params) : '';
  return apiClient.get<BundleListResponseDto>(
    `/api/bundles${query ? `?${query}` : ''}`,
  );
}

async function getBundle(id: string): Promise<BundleResponseDto> {
  return apiClient.get<BundleResponseDto>(`/api/bundles/${id}`);
}

async function createBundle(data: CreateBundleDto): Promise<BundleResponseDto> {
  return apiClient.post<BundleResponseDto>('/api/bundles', data);
}

async function updateBundle(
  id: string,
  data: UpdateBundleDto,
): Promise<BundleResponseDto> {
  return apiClient.put<BundleResponseDto>(`/api/bundles/${id}`, data);
}

async function deleteBundle(id: string): Promise<void> {
  return apiClient.delete(`/api/bundles/${id}`);
}

async function addUrlToBundle(
  bundleId: string,
  data: AddUrlToBundleDto,
): Promise<BundleResponseDto> {
  return apiClient.post<BundleResponseDto>(`/api/bundles/${bundleId}/urls`, data);
}

async function addMultipleUrlsToBundle(
  bundleId: string,
  data: AddMultipleUrlsDto,
): Promise<BundleResponseDto> {
  return apiClient.post<BundleResponseDto>(
    `/api/bundles/${bundleId}/urls/batch`,
    data,
  );
}

async function removeUrlFromBundle(
  bundleId: string,
  urlId: string,
): Promise<BundleResponseDto> {
  return apiClient.delete<BundleResponseDto>(
    `/api/bundles/${bundleId}/urls/${urlId}`,
  );
}

async function updateUrlOrder(
  bundleId: string,
  urlId: string,
  order: number,
): Promise<BundleResponseDto> {
  return apiClient.patch<BundleResponseDto>(
    `/api/bundles/${bundleId}/urls/${urlId}/order`,
    { order },
  );
}

async function getBundleStats(bundleId: string): Promise<BundleStatsDto> {
  return apiClient.get<BundleStatsDto>(`/api/bundles/${bundleId}/stats`);
}

async function archiveBundle(bundleId: string): Promise<BundleResponseDto> {
  return apiClient.post<BundleResponseDto>(`/api/bundles/${bundleId}/archive`, {});
}

async function restoreBundle(bundleId: string): Promise<BundleResponseDto> {
  return apiClient.post<BundleResponseDto>(`/api/bundles/${bundleId}/restore`, {});
}

// ==================== Hooks ====================

/**
 * Get all bundles with optional filters
 */
export function useBundles(params?: BundleQueryParams) {
  return useQuery({
    queryKey: bundleKeys.list(params),
    queryFn: () => getBundles(params),
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get a single bundle by ID
 */
export function useBundle(id: string) {
  return useQuery({
    queryKey: bundleKeys.detail(id),
    queryFn: () => getBundle(id),
    enabled: !!id,
    ...QUERY_CONFIG.DETAIL,
  });
}

/**
 * Get bundle statistics
 */
export function useBundleStats(id: string) {
  return useQuery({
    queryKey: bundleKeys.stats(id),
    queryFn: () => getBundleStats(id),
    enabled: !!id,
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Create a new bundle
 */
export function useCreateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
    },
  });
}

/**
 * Update a bundle
 */
export function useUpdateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBundleDto }) =>
      updateBundle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a bundle
 */
export function useDeleteBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
    },
  });
}

/**
 * Add URL to bundle
 */
export function useAddUrlToBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bundleId,
      data,
    }: {
      bundleId: string;
      data: AddUrlToBundleDto;
    }) => addUrlToBundle(bundleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(variables.bundleId) });
      queryClient.invalidateQueries({ queryKey: bundleKeys.stats(variables.bundleId) });
    },
  });
}

/**
 * Add multiple URLs to bundle
 */
export function useAddMultipleUrlsToBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bundleId,
      data,
    }: {
      bundleId: string;
      data: AddMultipleUrlsDto;
    }) => addMultipleUrlsToBundle(bundleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(variables.bundleId) });
      queryClient.invalidateQueries({ queryKey: bundleKeys.stats(variables.bundleId) });
    },
  });
}

/**
 * Remove URL from bundle
 */
export function useRemoveUrlFromBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bundleId, urlId }: { bundleId: string; urlId: string }) =>
      removeUrlFromBundle(bundleId, urlId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(variables.bundleId) });
      queryClient.invalidateQueries({ queryKey: bundleKeys.stats(variables.bundleId) });
    },
  });
}

/**
 * Update URL order in bundle
 */
export function useUpdateUrlOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bundleId,
      urlId,
      order,
    }: {
      bundleId: string;
      urlId: string;
      order: number;
    }) => updateUrlOrder(bundleId, urlId, order),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(variables.bundleId) });
    },
  });
}

/**
 * Archive a bundle
 */
export function useArchiveBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveBundle,
    onSuccess: (_, bundleId) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) });
    },
  });
}

/**
 * Restore an archived bundle
 */
export function useRestoreBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreBundle,
    onSuccess: (_, bundleId) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) });
    },
  });
}
