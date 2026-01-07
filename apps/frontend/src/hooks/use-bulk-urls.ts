/**
 * Bulk URL Operations Hooks
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { urlKeys } from './use-url';
import type {
  BulkCreateUrlDto,
  BulkCreateResultDto,
  BulkUpdateUrlDto,
  BulkUpdateResultDto,
  BulkDeleteUrlDto,
  BulkDeleteResultDto,
  CreateUrlDto,
  BulkUpdateOperation,
} from '@/lib/api/schemas';

// Re-export types
export type {
  BulkCreateUrlDto,
  BulkCreateResultDto,
  BulkUpdateUrlDto,
  BulkUpdateResultDto,
  BulkDeleteUrlDto,
  BulkDeleteResultDto,
  BulkUpdateOperation,
};

// ==================== API Functions ====================

async function bulkCreateUrls(
  data: BulkCreateUrlDto,
): Promise<BulkCreateResultDto> {
  return apiClient.post<BulkCreateResultDto>(
    '/api/urls/bulk',
    data as unknown as Record<string, unknown>,
  );
}

async function bulkUpdateUrls(
  data: BulkUpdateUrlDto,
): Promise<BulkUpdateResultDto> {
  return apiClient.patch<BulkUpdateResultDto>(
    '/api/urls/bulk',
    data as unknown as Record<string, unknown>,
  );
}

async function bulkDeleteUrls(
  data: BulkDeleteUrlDto,
): Promise<BulkDeleteResultDto> {
  return apiClient.delete<BulkDeleteResultDto>('/api/urls/bulk', {
    data: data as unknown as Record<string, unknown>,
  });
}

// ==================== Hooks ====================

/**
 * Bulk create URLs
 */
export function useBulkCreateUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (urls: CreateUrlDto[]) => bulkCreateUrls({ urls }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlKeys.lists() });
    },
  });
}

/**
 * Bulk update URLs
 */
export function useBulkUpdateUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      urlIds,
      operation,
    }: {
      urlIds: string[];
      operation: BulkUpdateOperation;
    }) => bulkUpdateUrls({ urlIds, operation }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: urlKeys.lists() });
      // Invalidate individual URL details
      for (const id of variables.urlIds) {
        queryClient.invalidateQueries({ queryKey: urlKeys.detail(id) });
      }
    },
  });
}

/**
 * Bulk delete URLs
 */
export function useBulkDeleteUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (urlIds: string[]) => bulkDeleteUrls({ urlIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlKeys.lists() });
    },
  });
}
