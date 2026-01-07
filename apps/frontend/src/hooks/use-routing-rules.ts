/**
 * Smart Routing Rules Hooks
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { urlKeys } from '@/hooks/use-url';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  CreateRoutingRuleDto,
  UpdateRoutingRuleDto,
  RoutingRuleResponseDto,
  RoutingRulesListResponseDto,
  RoutingRuleStatDto,
  UpdateSmartRoutingSettingsDto,
  SmartRoutingSettingsResponseDto,
  CreateFromTemplateDto,
  TemplateListResponseDto,
  RoutingAnalyticsResponseDto,
  AnalyticsQueryParams,
  ConditionItemDto,
  ConditionType,
  ConditionOperator,
  LogicalOperator,
  RoutingConditionsDto,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type {
  CreateRoutingRuleDto,
  UpdateRoutingRuleDto,
  RoutingRuleResponseDto,
  RoutingRulesListResponseDto,
  RoutingRuleStatDto,
  UpdateSmartRoutingSettingsDto,
  SmartRoutingSettingsResponseDto,
  CreateFromTemplateDto,
  TemplateListResponseDto,
  RoutingAnalyticsResponseDto,
  ConditionItemDto,
  ConditionType,
  ConditionOperator,
  LogicalOperator,
  RoutingConditionsDto,
};

// Query Keys (exported for external cache management)
export const routingRuleKeys = {
  all: ['routing-rules'] as const,
  lists: () => [...routingRuleKeys.all, 'list'] as const,
  list: (urlId: string) => [...routingRuleKeys.lists(), urlId] as const,
  details: () => [...routingRuleKeys.all, 'detail'] as const,
  detail: (urlId: string, ruleId: string) =>
    [...routingRuleKeys.details(), urlId, ruleId] as const,
  templates: () => [...routingRuleKeys.all, 'templates'] as const,
  analytics: (urlId: string, params?: AnalyticsQueryParams) =>
    [...routingRuleKeys.all, 'analytics', urlId, params] as const,
};

// ==================== API Functions ====================

async function getRoutingRules(urlId: string): Promise<RoutingRulesListResponseDto> {
  return apiClient.get<RoutingRulesListResponseDto>(`/api/urls/${urlId}/routing-rules`);
}

async function getRoutingRule(
  urlId: string,
  ruleId: string,
): Promise<RoutingRuleResponseDto> {
  return apiClient.get<RoutingRuleResponseDto>(
    `/api/urls/${urlId}/routing-rules/${ruleId}`,
  );
}

async function createRoutingRule(
  urlId: string,
  data: CreateRoutingRuleDto,
): Promise<RoutingRuleResponseDto> {
  return apiClient.post<RoutingRuleResponseDto>(
    `/api/urls/${urlId}/routing-rules`,
    data as unknown as Record<string, unknown>,
  );
}

async function createRoutingRuleFromTemplate(
  urlId: string,
  data: CreateFromTemplateDto,
): Promise<RoutingRuleResponseDto> {
  return apiClient.post<RoutingRuleResponseDto>(
    `/api/urls/${urlId}/routing-rules/from-template`,
    data as unknown as Record<string, unknown>,
  );
}

async function updateRoutingRule(
  urlId: string,
  ruleId: string,
  data: UpdateRoutingRuleDto,
): Promise<RoutingRuleResponseDto> {
  return apiClient.put<RoutingRuleResponseDto>(
    `/api/urls/${urlId}/routing-rules/${ruleId}`,
    data as unknown as Record<string, unknown>,
  );
}

async function deleteRoutingRule(
  urlId: string,
  ruleId: string,
): Promise<void> {
  return apiClient.delete(`/api/urls/${urlId}/routing-rules/${ruleId}`);
}

async function updateSmartRoutingSettings(
  urlId: string,
  data: UpdateSmartRoutingSettingsDto,
): Promise<SmartRoutingSettingsResponseDto> {
  return apiClient.patch<SmartRoutingSettingsResponseDto>(
    `/api/urls/${urlId}/routing-rules/settings`,
    data as unknown as Record<string, unknown>,
  );
}

async function getRoutingTemplates(): Promise<TemplateListResponseDto> {
  return apiClient.get<TemplateListResponseDto>('/api/routing-templates');
}

async function getRoutingAnalytics(
  urlId: string,
  params?: AnalyticsQueryParams,
): Promise<RoutingAnalyticsResponseDto> {
  const searchParams = new URLSearchParams();
  if (params?.timeRange) searchParams.set('timeRange', params.timeRange);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();
  const url = `/api/analytics/urls/${urlId}/routing${query ? `?${query}` : ''}`;
  return apiClient.get<RoutingAnalyticsResponseDto>(url);
}

// ==================== Hooks ====================

/**
 * Get all routing rules for a URL
 */
export function useRoutingRules(urlId: string) {
  return useQuery({
    queryKey: routingRuleKeys.list(urlId),
    queryFn: () => getRoutingRules(urlId),
    enabled: !!urlId,
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get a single routing rule
 */
export function useRoutingRule(urlId: string, ruleId: string) {
  return useQuery({
    queryKey: routingRuleKeys.detail(urlId, ruleId),
    queryFn: () => getRoutingRule(urlId, ruleId),
    enabled: !!urlId && !!ruleId,
    ...QUERY_CONFIG.DETAIL,
  });
}

/**
 * Get available routing templates
 */
export function useRoutingTemplates() {
  return useQuery({
    queryKey: routingRuleKeys.templates(),
    queryFn: getRoutingTemplates,
    ...QUERY_CONFIG.STATIC,
  });
}

/**
 * Create a new routing rule
 */
export function useCreateRoutingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, data }: { urlId: string; data: CreateRoutingRuleDto }) =>
      createRoutingRule(urlId, data),
    onSuccess: (_, variables) => {
      // Invalidate routing rules list
      queryClient.invalidateQueries({
        queryKey: routingRuleKeys.list(variables.urlId),
      });
      // Invalidate URL details (to refresh isSmartRouting flag)
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
    },
  });
}

/**
 * Create a routing rule from template
 */
export function useCreateRoutingRuleFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, data }: { urlId: string; data: CreateFromTemplateDto }) =>
      createRoutingRuleFromTemplate(urlId, data),
    onSuccess: (_, variables) => {
      // Invalidate routing rules list
      queryClient.invalidateQueries({
        queryKey: routingRuleKeys.list(variables.urlId),
      });
      // Invalidate URL details (to refresh isSmartRouting flag)
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
    },
  });
}

/**
 * Update a routing rule
 */
export function useUpdateRoutingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      urlId,
      ruleId,
      data,
    }: {
      urlId: string;
      ruleId: string;
      data: UpdateRoutingRuleDto;
    }) => updateRoutingRule(urlId, ruleId, data),
    onSuccess: (_, variables) => {
      // Invalidate routing rules list
      queryClient.invalidateQueries({
        queryKey: routingRuleKeys.list(variables.urlId),
      });
      // Invalidate specific rule
      queryClient.invalidateQueries({
        queryKey: routingRuleKeys.detail(variables.urlId, variables.ruleId),
      });
    },
  });
}

/**
 * Delete a routing rule
 */
export function useDeleteRoutingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, ruleId }: { urlId: string; ruleId: string }) =>
      deleteRoutingRule(urlId, ruleId),
    onSuccess: (_, variables) => {
      // Invalidate routing rules list
      queryClient.invalidateQueries({
        queryKey: routingRuleKeys.list(variables.urlId),
      });
      // Invalidate URL details (to refresh isSmartRouting flag if last rule)
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
    },
  });
}

/**
 * Update smart routing settings
 */
export function useUpdateSmartRoutingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, data }: { urlId: string; data: UpdateSmartRoutingSettingsDto }) =>
      updateSmartRoutingSettings(urlId, data),
    onSuccess: (_, variables) => {
      // Invalidate routing rules list
      queryClient.invalidateQueries({
        queryKey: routingRuleKeys.list(variables.urlId),
      });
      // Invalidate URL details
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
    },
  });
}

/**
 * Get routing analytics for a URL
 */
export function useRoutingAnalytics(urlId: string, params?: AnalyticsQueryParams) {
  return useQuery({
    queryKey: routingRuleKeys.analytics(urlId, params),
    queryFn: () => getRoutingAnalytics(urlId, params),
    enabled: !!urlId,
    ...QUERY_CONFIG.STANDARD,
  });
}
