/**
 * A/B Testing Variants Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponse,
  VariantListResponse,
} from '@/types/api';

// Query Keys
const variantKeys = {
  all: ['variants'] as const,
  lists: () => [...variantKeys.all, 'list'] as const,
  list: (urlId: string) => [...variantKeys.lists(), urlId] as const,
  details: () => [...variantKeys.all, 'detail'] as const,
  detail: (urlId: string, variantId: string) =>
    [...variantKeys.details(), urlId, variantId] as const,
};

// ==================== API Functions ====================

async function getVariants(urlId: string): Promise<VariantListResponse> {
  return apiClient.get<VariantListResponse>(`/api/urls/${urlId}/variants`);
}

async function getVariant(
  urlId: string,
  variantId: string,
): Promise<VariantResponse> {
  return apiClient.get<VariantResponse>(
    `/api/urls/${urlId}/variants/${variantId}`,
  );
}

async function createVariant(
  urlId: string,
  data: CreateVariantDto,
): Promise<VariantResponse> {
  return apiClient.post<VariantResponse>(`/api/urls/${urlId}/variants`, data);
}

async function updateVariant(
  urlId: string,
  variantId: string,
  data: UpdateVariantDto,
): Promise<VariantResponse> {
  return apiClient.put<VariantResponse>(
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
    staleTime: 30 * 1000, // 30 seconds
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
    staleTime: 30 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['urls', variables.urlId] });
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
      queryClient.invalidateQueries({ queryKey: ['urls', variables.urlId] });
    },
  });
}
