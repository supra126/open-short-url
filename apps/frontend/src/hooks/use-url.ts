/**
 * URL Management Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateUrlDto,
  UpdateUrlDto,
  UrlResponse,
  UrlListResponse,
  UrlQueryParams,
} from '@/types/api';

// Query Keys
const urlKeys = {
  all: ['urls'] as const,
  lists: () => [...urlKeys.all, 'list'] as const,
  list: (params: UrlQueryParams) => [...urlKeys.lists(), params] as const,
  details: () => [...urlKeys.all, 'detail'] as const,
  detail: (id: string) => [...urlKeys.details(), id] as const,
};

// ==================== API Functions ====================

async function getUrls(
  params: UrlQueryParams,
): Promise<UrlListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return apiClient.get<UrlListResponse>(
    `/api/urls?${searchParams.toString()}`,
  );
}

async function getUrl(id: string): Promise<UrlResponse> {
  return apiClient.get<UrlResponse>(`/api/urls/${id}`);
}

async function createUrl(
  data: CreateUrlDto,
): Promise<UrlResponse> {
  return apiClient.post<UrlResponse>('/api/urls', data);
}

async function updateUrl(
  id: string,
  data: UpdateUrlDto,
): Promise<UrlResponse> {
  return apiClient.put<UrlResponse>(`/api/urls/${id}`, data);
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
    staleTime: 0, // Always fetch fresh data when component mounts
    gcTime: 5 * 60 * 1000, // 5 minutes - Keep cache for navigation
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
    staleTime: 5 * 60 * 1000, // 5 minutes - Single URL details increased from 1 minute to 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes - Keep cache longer
  });
}

/**
 * Create URL
 */
export function useCreateUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUrlDto) => createUrl(data),
    onSuccess: async () => {
      // Refetch list cache immediately to ensure fresh data on navigation back
      await queryClient.refetchQueries({
        queryKey: urlKeys.lists(),
        type: 'all', // Refetch both active and inactive queries
      });
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
    onSuccess: async (_, variables) => {
      // Refetch list and detail cache
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: urlKeys.lists(),
          type: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: urlKeys.detail(variables.id),
        }),
      ]);
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
    onSuccess: async () => {
      // Refetch list cache
      await queryClient.refetchQueries({
        queryKey: urlKeys.lists(),
        type: 'all',
      });
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
