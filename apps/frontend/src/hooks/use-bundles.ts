/**
 * Bundles Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateBundleDto,
  UpdateBundleDto,
  BundleResponse,
  BundleListResponse,
  BundleQueryDto,
  AddUrlToBundleDto,
  AddMultipleUrlsDto,
  BundleStatsResponse,
} from '@/types/api';

// Query Keys
const bundleKeys = {
  all: ['bundles'] as const,
  lists: () => [...bundleKeys.all, 'list'] as const,
  list: (params?: BundleQueryDto) => [...bundleKeys.lists(), params] as const,
  details: () => [...bundleKeys.all, 'detail'] as const,
  detail: (id: string) => [...bundleKeys.details(), id] as const,
  stats: (id: string) => [...bundleKeys.all, 'stats', id] as const,
};

// ==================== API Functions ====================

async function getBundles(params?: BundleQueryDto): Promise<BundleListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.search) queryParams.set('search', params.search);

  const query = queryParams.toString();
  return apiClient.get<BundleListResponse>(
    `/api/bundles${query ? `?${query}` : ''}`,
  );
}

async function getBundle(id: string): Promise<BundleResponse> {
  return apiClient.get<BundleResponse>(`/api/bundles/${id}`);
}

async function createBundle(data: CreateBundleDto): Promise<BundleResponse> {
  return apiClient.post<BundleResponse>('/api/bundles', data);
}

async function updateBundle(
  id: string,
  data: UpdateBundleDto,
): Promise<BundleResponse> {
  return apiClient.put<BundleResponse>(`/api/bundles/${id}`, data);
}

async function deleteBundle(id: string): Promise<void> {
  return apiClient.delete(`/api/bundles/${id}`);
}

async function addUrlToBundle(
  bundleId: string,
  data: AddUrlToBundleDto,
): Promise<BundleResponse> {
  return apiClient.post<BundleResponse>(`/api/bundles/${bundleId}/urls`, data);
}

async function addMultipleUrlsToBundle(
  bundleId: string,
  data: AddMultipleUrlsDto,
): Promise<BundleResponse> {
  return apiClient.post<BundleResponse>(
    `/api/bundles/${bundleId}/urls/batch`,
    data,
  );
}

async function removeUrlFromBundle(
  bundleId: string,
  urlId: string,
): Promise<BundleResponse> {
  return apiClient.delete<BundleResponse>(
    `/api/bundles/${bundleId}/urls/${urlId}`,
  );
}

async function updateUrlOrder(
  bundleId: string,
  urlId: string,
  order: number,
): Promise<BundleResponse> {
  return apiClient.patch<BundleResponse>(
    `/api/bundles/${bundleId}/urls/${urlId}/order`,
    { order },
  );
}

async function getBundleStats(bundleId: string): Promise<BundleStatsResponse> {
  return apiClient.get<BundleStatsResponse>(`/api/bundles/${bundleId}/stats`);
}

async function archiveBundle(bundleId: string): Promise<BundleResponse> {
  return apiClient.post<BundleResponse>(`/api/bundles/${bundleId}/archive`, {});
}

async function restoreBundle(bundleId: string): Promise<BundleResponse> {
  return apiClient.post<BundleResponse>(`/api/bundles/${bundleId}/restore`, {});
}

// ==================== Hooks ====================

/**
 * Get all bundles with optional filters
 */
export function useBundles(params?: BundleQueryDto) {
  return useQuery({
    queryKey: bundleKeys.list(params),
    queryFn: () => getBundles(params),
    staleTime: 30 * 1000, // 30 seconds
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
    staleTime: 30 * 1000, // 30 seconds
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
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Create a new bundle
 */
export function useCreateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBundle,
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: bundleKeys.lists(),
        type: 'all',
      });
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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: bundleKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.detail(variables.id),
        }),
      ]);
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
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: bundleKeys.lists(),
        type: 'all',
      });
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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: bundleKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.detail(variables.bundleId),
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.stats(variables.bundleId),
        }),
      ]);
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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: bundleKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.detail(variables.bundleId),
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.stats(variables.bundleId),
        }),
      ]);
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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: bundleKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.detail(variables.bundleId),
        }),
        queryClient.invalidateQueries({
          queryKey: bundleKeys.stats(variables.bundleId),
        }),
      ]);
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: bundleKeys.detail(variables.bundleId),
      });
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
    onSuccess: async (_, bundleId) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: bundleKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) }),
      ]);
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
    onSuccess: async (_, bundleId) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: bundleKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) }),
      ]);
    },
  });
}
