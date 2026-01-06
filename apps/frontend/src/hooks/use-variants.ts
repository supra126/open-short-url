/**
 * A/B Testing Variants Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { urlKeys } from '@/hooks/use-url';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
  VariantStatsDto,
  VariantListResponseDto,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { CreateVariantDto, UpdateVariantDto, VariantResponseDto, VariantStatsDto, VariantListResponseDto };

// Query Keys (exported for external cache management)
export const variantKeys = {
  all: ['variants'] as const,
  lists: () => [...variantKeys.all, 'list'] as const,
  list: (urlId: string) => [...variantKeys.lists(), urlId] as const,
  details: () => [...variantKeys.all, 'detail'] as const,
  detail: (urlId: string, variantId: string) =>
    [...variantKeys.details(), urlId, variantId] as const,
};

// ==================== API Functions ====================

async function getVariants(urlId: string): Promise<VariantListResponseDto> {
  return apiClient.get<VariantListResponseDto>(`/api/urls/${urlId}/variants`);
}

async function getVariant(
  urlId: string,
  variantId: string,
): Promise<VariantResponseDto> {
  return apiClient.get<VariantResponseDto>(
    `/api/urls/${urlId}/variants/${variantId}`,
  );
}

async function createVariant(
  urlId: string,
  data: CreateVariantDto,
): Promise<VariantResponseDto> {
  return apiClient.post<VariantResponseDto>(`/api/urls/${urlId}/variants`, data);
}

async function updateVariant(
  urlId: string,
  variantId: string,
  data: UpdateVariantDto,
): Promise<VariantResponseDto> {
  return apiClient.put<VariantResponseDto>(
    `/api/urls/${urlId}/variants/${variantId}`,
    data,
  );
}

async function deleteVariant(
  urlId: string,
  variantId: string,
): Promise<void> {
  return apiClient.delete(`/api/urls/${urlId}/variants/${variantId}`);
}

// ==================== Hooks ====================

/**
 * Get all variants for a URL
 */
export function useVariants(urlId: string) {
  return useQuery({
    queryKey: variantKeys.list(urlId),
    queryFn: () => getVariants(urlId),
    enabled: !!urlId,
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get a single variant
 */
export function useVariant(urlId: string, variantId: string) {
  return useQuery({
    queryKey: variantKeys.detail(urlId, variantId),
    queryFn: () => getVariant(urlId, variantId),
    enabled: !!urlId && !!variantId,
    ...QUERY_CONFIG.DETAIL,
  });
}

/**
 * Create a new variant
 */
export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, data }: { urlId: string; data: CreateVariantDto }) =>
      createVariant(urlId, data),
    onSuccess: (_, variables) => {
      // Invalidate variants list
      queryClient.invalidateQueries({
        queryKey: variantKeys.list(variables.urlId),
      });
      // Invalidate URL details (to refresh isAbTest flag)
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
    },
  });
}

/**
 * Update a variant
 */
export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      urlId,
      variantId,
      data,
    }: {
      urlId: string;
      variantId: string;
      data: UpdateVariantDto;
    }) => updateVariant(urlId, variantId, data),
    onSuccess: (_, variables) => {
      // Invalidate variants list
      queryClient.invalidateQueries({
        queryKey: variantKeys.list(variables.urlId),
      });
      // Invalidate specific variant
      queryClient.invalidateQueries({
        queryKey: variantKeys.detail(variables.urlId, variables.variantId),
      });
    },
  });
}

/**
 * Delete a variant
 */
export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, variantId }: { urlId: string; variantId: string }) =>
      deleteVariant(urlId, variantId),
    onSuccess: (_, variables) => {
      // Invalidate variants list
      queryClient.invalidateQueries({
        queryKey: variantKeys.list(variables.urlId),
      });
      // Invalidate URL details (to refresh isAbTest flag if last variant)
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
    },
  });
}
