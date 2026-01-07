/**
 * Dashboard Hooks
 * Provides aggregated data for the dashboard page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  UrlResponseDto,
  UrlListResponseDto,
  AnalyticsQueryParams,
  TimeSeriesDataPoint,
  DashboardStatsResponseDto,
  TopPerformingUrlDto,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { TimeSeriesDataPoint, DashboardStatsResponseDto, TopPerformingUrlDto };

// Legacy type aliases for backwards compatibility
export type DashboardStatsResponse = DashboardStatsResponseDto;
export type TopPerformingUrl = TopPerformingUrlDto;

// Query Keys (exported for external cache management)
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recentUrls: (limit: number) => [...dashboardKeys.all, 'recent-urls', limit] as const,
  topUrls: (limit: number, params: AnalyticsQueryParams) =>
    [...dashboardKeys.all, 'top-urls', limit, params] as const,
};

// ==================== API Functions ====================

async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return apiClient.get<DashboardStatsResponse>('/api/urls/stats');
}

async function getRecentUrls(limit: number): Promise<UrlResponseDto[]> {
  const params = {
    page: 1,
    pageSize: limit,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };
  const query = buildQueryParams(params);
  const response = await apiClient.get<UrlListResponseDto>(`/api/urls?${query}`);
  return response.data;
}

async function getTopPerformingUrls(
  limit: number,
  params: AnalyticsQueryParams,
): Promise<TopPerformingUrl[]> {
  const queryParams = {
    ...params,
    limit,
  };
  const query = buildQueryParams(queryParams);
  return apiClient.get<TopPerformingUrl[]>(`/api/analytics/top-urls?${query}`);
}

// ==================== Hooks ====================

/**
 * Get dashboard statistics (total, active, inactive, expired URLs)
 * Falls back to calculating from URL list if stats endpoint is not available
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      try {
        return await getDashboardStats();
      } catch {
        // Fallback: fetch URLs and calculate stats manually
        const response = await apiClient.get<UrlListResponseDto>(
          '/api/urls?pageSize=1000',
        );
        const urls = response.data;
        const now = new Date();

        return {
          totalUrls: response.total,
          activeUrls: urls.filter((u) => u.status === 'ACTIVE').length,
          inactiveUrls: urls.filter((u) => u.status === 'INACTIVE').length,
          expiredUrls: urls.filter(
            (u) => u.expiresAt && new Date(u.expiresAt) < now,
          ).length,
        };
      }
    },
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Get recently created URLs
 */
export function useRecentUrls(limit: number = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentUrls(limit),
    queryFn: () => getRecentUrls(limit),
    ...QUERY_CONFIG.LIVE,
  });
}

/**
 * Get top performing URLs by click count
 * Falls back to sorting URL list if top-urls endpoint is not available
 */
export function useTopPerformingUrls(
  limit: number = 5,
  params: AnalyticsQueryParams = { timeRange: 'last_7_days' },
) {
  return useQuery({
    queryKey: dashboardKeys.topUrls(limit, params),
    queryFn: async () => {
      try {
        return await getTopPerformingUrls(limit, params);
      } catch {
        // Fallback: fetch URLs sorted by clickCount
        const response = await apiClient.get<UrlListResponseDto>(
          `/api/urls?pageSize=${limit}&sortBy=clickCount&sortOrder=desc`,
        );
        return response.data.map((url) => ({
          id: url.id,
          slug: url.slug,
          title: url.title,
          originalUrl: url.originalUrl,
          clickCount: url.clickCount,
          status: url.status,
          createdAt: url.createdAt,
        }));
      }
    },
    ...QUERY_CONFIG.LIVE,
  });
}
