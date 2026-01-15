/**
 * Analytics Hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  AnalyticsQueryParams,
  AnalyticsResponseDto,
  RecentClicksResponseDto,
  RecentClickDto,
  BotAnalyticsResponseDto,
  BotTypeStat,
  UserBotAnalyticsResponseDto,
  AbTestAnalyticsResponseDto,
  TopPerformingVariant,
  TimeRange,
  DeviceStat,
  GeoLocationStat,
  UtmStat,
  TimeSeriesDataPoint,
  ExportFormat,
  ExportQueryParams,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type {
  AnalyticsQueryParams,
  AnalyticsResponseDto,
  RecentClicksResponseDto,
  RecentClickDto,
  BotAnalyticsResponseDto,
  BotTypeStat,
  UserBotAnalyticsResponseDto,
  AbTestAnalyticsResponseDto,
  TopPerformingVariant,
  TimeRange,
  DeviceStat,
  GeoLocationStat,
  UtmStat,
  TimeSeriesDataPoint,
  ExportFormat,
  ExportQueryParams,
};

// Query Keys (exported for external cache management)
export const analyticsKeys = {
  all: ['analytics'] as const,
  url: (id: string, params: AnalyticsQueryParams) =>
    [...analyticsKeys.all, 'url', id, params] as const,
  overview: (params: AnalyticsQueryParams) =>
    [...analyticsKeys.all, 'overview', params] as const,
  recentClicks: (id: string, limit?: number, includeBots?: boolean) =>
    [...analyticsKeys.all, 'recent-clicks', id, limit, includeBots] as const,
  botAnalytics: (id: string, params: AnalyticsQueryParams) =>
    [...analyticsKeys.all, 'bot-analytics', id, params] as const,
  userBotAnalytics: (params: AnalyticsQueryParams) =>
    [...analyticsKeys.all, 'user-bot-analytics', params] as const,
  userAbTestAnalytics: (params: AnalyticsQueryParams) =>
    [...analyticsKeys.all, 'user-abtest-analytics', params] as const,
};

// ==================== API Functions ====================

async function getUrlAnalytics(
  id: string,
  params: AnalyticsQueryParams,
): Promise<AnalyticsResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<AnalyticsResponseDto>(
    `/api/analytics/urls/${id}?${query}`,
  );
}

async function getUserAnalytics(
  params: AnalyticsQueryParams,
): Promise<AnalyticsResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<AnalyticsResponseDto>(
    `/api/analytics/overview?${query}`,
  );
}

async function getRecentClicks(
  id: string,
  limit: number,
  includeBots: boolean = false,
): Promise<RecentClicksResponseDto> {
  const query = buildQueryParams({ limit, includeBots });
  return apiClient.get<RecentClicksResponseDto>(
    `/api/analytics/urls/${id}/recent-clicks${query ? `?${query}` : ''}`,
  );
}

async function getBotAnalytics(
  id: string,
  params: AnalyticsQueryParams,
): Promise<BotAnalyticsResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<BotAnalyticsResponseDto>(
    `/api/analytics/urls/${id}/bots?${query}`,
  );
}

async function getUserBotAnalytics(
  params: AnalyticsQueryParams,
): Promise<UserBotAnalyticsResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<UserBotAnalyticsResponseDto>(
    `/api/analytics/bots?${query}`,
  );
}

async function getUserAbTestAnalytics(
  params: AnalyticsQueryParams,
): Promise<AbTestAnalyticsResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<AbTestAnalyticsResponseDto>(
    `/api/analytics/ab-tests?${query}`,
  );
}

// ==================== Hooks ====================

/**
 * Get analytics for a single URL
 */
export function useUrlAnalytics(
  id: string,
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: analyticsKeys.url(id, params),
    queryFn: () => getUrlAnalytics(id, params),
    enabled: !!id,
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Get analytics for all user URLs
 */
export function useUserAnalytics(
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => getUserAnalytics(params),
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Get recent click records
 */
export function useRecentClicks(id: string, limit: number = 20, includeBots: boolean = false) {
  return useQuery({
    queryKey: analyticsKeys.recentClicks(id, limit, includeBots),
    queryFn: () => getRecentClicks(id, limit, includeBots),
    enabled: !!id,
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Get bot analytics for a URL
 */
export function useBotAnalytics(
  id: string,
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: analyticsKeys.botAnalytics(id, params),
    queryFn: () => getBotAnalytics(id, params),
    enabled: !!id,
    ...QUERY_CONFIG.STANDARD,
  });
}

/**
 * Get bot analytics for all user URLs
 */
export function useUserBotAnalytics(
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: analyticsKeys.userBotAnalytics(params),
    queryFn: () => getUserBotAnalytics(params),
    ...QUERY_CONFIG.STANDARD,
    refetchInterval: 120 * 1000, // Bot stats change less frequently
  });
}

/**
 * Get A/B Testing analytics for all user URLs
 */
export function useUserAbTestAnalytics(
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: analyticsKeys.userAbTestAnalytics(params),
    queryFn: () => getUserAbTestAnalytics(params),
    ...QUERY_CONFIG.STANDARD,
    refetchInterval: 120 * 1000, // A/B test stats change less frequently
  });
}
