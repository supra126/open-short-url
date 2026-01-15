/**
 * Webhooks Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_CONFIG } from '@/lib/query-config';
import { buildQueryParams } from '@/lib/utils';
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookListResponseDto,
  WebhookLogResponseDto,
  WebhookLogsListResponseDto,
  WebhookTestResponseDto,
  PaginationParams,
} from '@/lib/api/schemas';

// Query params type for webhooks list
// Using PaginationParams as backend WebhookQueryDto only supports pagination
export type WebhookQueryParams = PaginationParams;

// Re-export types for consumers of this hook
export type {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookListResponseDto,
  WebhookLogResponseDto,
  WebhookLogsListResponseDto,
  WebhookTestResponseDto,
  PaginationParams,
};

// Query Keys (exported for external cache management)
export const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (params?: WebhookQueryParams) => [...webhookKeys.lists(), params] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  logs: (id: string, params?: PaginationParams) =>
    [...webhookKeys.all, 'logs', id, params] as const,
};

// ==================== API Functions ====================

async function getWebhooks(params?: WebhookQueryParams): Promise<WebhookListResponseDto> {
  const query = params ? buildQueryParams(params) : '';
  return apiClient.get<WebhookListResponseDto>(`/api/webhooks${query ? `?${query}` : ''}`);
}

async function getWebhook(id: string): Promise<WebhookResponseDto> {
  return apiClient.get<WebhookResponseDto>(`/api/webhooks/${id}`);
}

async function createWebhook(
  data: CreateWebhookDto,
): Promise<WebhookResponseDto> {
  return apiClient.post<WebhookResponseDto>('/api/webhooks', data);
}

async function updateWebhook(
  id: string,
  data: UpdateWebhookDto,
): Promise<WebhookResponseDto> {
  return apiClient.put<WebhookResponseDto>(`/api/webhooks/${id}`, data);
}

async function deleteWebhook(id: string): Promise<void> {
  return apiClient.delete(`/api/webhooks/${id}`);
}

async function getWebhookLogs(
  id: string,
  params?: PaginationParams,
): Promise<WebhookLogsListResponseDto> {
  const query = params ? buildQueryParams(params) : '';
  return apiClient.get<WebhookLogsListResponseDto>(
    `/api/webhooks/${id}/logs${query ? `?${query}` : ''}`,
  );
}

async function testWebhook(id: string): Promise<WebhookTestResponseDto> {
  return apiClient.post<WebhookTestResponseDto>(`/api/webhooks/${id}/test`, {});
}

// ==================== Hooks ====================

/**
 * Get all webhooks with pagination
 */
export function useWebhooks(params?: WebhookQueryParams) {
  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: () => getWebhooks(params),
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get a single webhook
 */
export function useWebhook(id: string) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: () => getWebhook(id),
    enabled: !!id,
    ...QUERY_CONFIG.DETAIL,
  });
}

/**
 * Get webhook logs (paginated)
 */
export function useWebhookLogs(id: string, params?: PaginationParams) {
  return useQuery({
    queryKey: webhookKeys.logs(id, params),
    queryFn: () => getWebhookLogs(id, params),
    enabled: !!id,
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Create a new webhook
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

/**
 * Update a webhook
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookDto }) =>
      updateWebhook(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a webhook
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

/**
 * Test a webhook
 */
export function useTestWebhook() {
  return useMutation({
    mutationFn: testWebhook,
  });
}
