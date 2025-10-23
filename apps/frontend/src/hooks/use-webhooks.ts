/**
 * Webhooks Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponse,
  WebhookListResponse,
  WebhookLogsListResponse,
  WebhookTestResponse,
} from '@/types/api';

// Query Keys
const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: () => [...webhookKeys.lists()] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  logs: (id: string, page: number, pageSize: number) =>
    [...webhookKeys.all, 'logs', id, page, pageSize] as const,
};

// ==================== API Functions ====================

async function getWebhooks(): Promise<WebhookListResponse> {
  return apiClient.get<WebhookListResponse>('/api/webhooks');
}

async function getWebhook(id: string): Promise<WebhookResponse> {
  return apiClient.get<WebhookResponse>(`/api/webhooks/${id}`);
}

async function createWebhook(
  data: CreateWebhookDto,
): Promise<WebhookResponse> {
  return apiClient.post<WebhookResponse>('/api/webhooks', data);
}

async function updateWebhook(
  id: string,
  data: UpdateWebhookDto,
): Promise<WebhookResponse> {
  return apiClient.put<WebhookResponse>(`/api/webhooks/${id}`, data);
}

async function deleteWebhook(id: string): Promise<void> {
  return apiClient.delete(`/api/webhooks/${id}`);
}

async function getWebhookLogs(
  id: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<WebhookLogsListResponse> {
  return apiClient.get<WebhookLogsListResponse>(
    `/api/webhooks/${id}/logs?page=${page}&pageSize=${pageSize}`,
  );
}

async function testWebhook(id: string): Promise<WebhookTestResponse> {
  return apiClient.post<WebhookTestResponse>(`/api/webhooks/${id}/test`, {});
}

// ==================== Hooks ====================

/**
 * Get all webhooks
 */
export function useWebhooks() {
  return useQuery({
    queryKey: webhookKeys.list(),
    queryFn: getWebhooks,
    staleTime: 30 * 1000, // 30 seconds
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
    staleTime: 30 * 1000,
  });
}

/**
 * Get webhook logs (paginated)
 */
export function useWebhookLogs(
  id: string,
  page: number = 1,
  pageSize: number = 20,
) {
  return useQuery({
    queryKey: webhookKeys.logs(id, page, pageSize),
    queryFn: () => getWebhookLogs(id, page, pageSize),
    enabled: !!id,
    staleTime: 15 * 1000, // 15 seconds
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
      // Invalidate webhooks list
      queryClient.invalidateQueries({ queryKey: webhookKeys.list() });
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
      // Invalidate webhooks list and specific webhook
      queryClient.invalidateQueries({ queryKey: webhookKeys.list() });
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
      // Invalidate webhooks list
      queryClient.invalidateQueries({ queryKey: webhookKeys.list() });
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
