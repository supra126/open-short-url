/**
 * Analytics Hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AnalyticsQueryParams,
  AnalyticsResponse,
  RecentClicksResponse,
  BotAnalyticsResponse,
  UserBotAnalyticsResponse,
  UserAbTestAnalyticsResponse,
} from '@/types/api';

// Query Keys
const analyticsKeys = {
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
): Promise<AnalyticsResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return apiClient.get<AnalyticsResponse>(
    `/api/analytics/urls/${id}?${searchParams.toString()}`,
  );
}

async function getUserAnalytics(
  params: AnalyticsQueryParams,
): Promise<AnalyticsResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return apiClient.get<AnalyticsResponse>(
    `/api/analytics/overview?${searchParams.toString()}`,
  );
}

async function getRecentClicks(
  id: string,
  limit: number,
  includeBots: boolean = false,
): Promise<RecentClicksResponse> {
  return apiClient.get<RecentClicksResponse>(
    `/api/analytics/urls/${id}/recent-clicks?limit=${limit}&includeBots=${includeBots}`,
  );
}

async function getBotAnalytics(
  id: string,
  params: AnalyticsQueryParams,
): Promise<BotAnalyticsResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return apiClient.get<BotAnalyticsResponse>(
    `/api/analytics/urls/${id}/bots?${searchParams.toString()}`,
  );
}

async function getUserBotAnalytics(
  params: AnalyticsQueryParams,
): Promise<UserBotAnalyticsResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return apiClient.get<UserBotAnalyticsResponse>(
    `/api/analytics/bots?${searchParams.toString()}`,
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
    staleTime: 30 * 1000, // 30 seconds - Refresh more frequently for timely analytics
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every 60 seconds when page is active
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
    staleTime: 30 * 1000, // 30 seconds - Refresh more frequently for timely analytics
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every 60 seconds when page is active
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
    staleTime: 30 * 1000, // 30 seconds - Refresh more frequently for recent clicks
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every 60 seconds when page is active
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
    staleTime: 60 * 1000, // 1 minute - Bot stats change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 60 * 1000, // 1 minute - Bot stats change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 120 * 1000, // Auto-refetch every 2 minutes when page is active
  });
}

/**
 * Get A/B Testing analytics for all user URLs
 */
async function getUserAbTestAnalytics(
  params: AnalyticsQueryParams,
): Promise<UserAbTestAnalyticsResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return apiClient.get<UserAbTestAnalyticsResponse>(
    `/api/analytics/ab-tests?${searchParams.toString()}`,
  );
}

/**
 * Hook: Get A/B Testing analytics for all user URLs
 */
export function useUserAbTestAnalytics(
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: analyticsKeys.userAbTestAnalytics(params),
    queryFn: () => getUserAbTestAnalytics(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 120 * 1000, // Auto-refetch every 2 minutes when page is active
  });
}
