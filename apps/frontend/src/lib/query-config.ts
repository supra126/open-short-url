/**
 * Unified Query Configuration
 * Centralized cache strategy settings for React Query hooks
 */

/**
 * Query cache configuration presets
 * Use these presets to ensure consistent caching behavior across hooks
 */
export const QUERY_CONFIG = {
  /**
   * Real-time data - requires frequent updates
   * Use for: analytics dashboards, live metrics
   */
  REALTIME: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  },

  /**
   * Live data - moderately frequent updates
   * Use for: URL click counts, webhook logs
   */
  LIVE: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // 1 minute
  },

  /**
   * Standard data - normal refresh rate
   * Use for: URL lists, bundle lists, user lists
   */
  STANDARD: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Detail data - less frequent updates
   * Use for: single URL details, single bundle details
   */
  DETAIL: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * Static data - rarely changes
   * Use for: user profile, API keys
   */
  STATIC: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
} as const;

/**
 * Helper to get config with optional overrides
 */
export function getQueryConfig<T extends keyof typeof QUERY_CONFIG>(
  preset: T,
  overrides?: Partial<(typeof QUERY_CONFIG)[T]>
): (typeof QUERY_CONFIG)[T] {
  return {
    ...QUERY_CONFIG[preset],
    ...overrides,
  };
}
