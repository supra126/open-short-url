/**
 * Analytics configuration constants
 * These values control data export and query limits
 */
export const ANALYTICS_CONFIG = {
  /**
   * Maximum number of records to export in a single request
   * Prevents memory exhaustion for large datasets
   * Can be overridden via environment variable
   */
  EXPORT_MAX_RECORDS: parseInt(process.env.ANALYTICS_EXPORT_MAX_RECORDS || '10000', 10),

  /**
   * Batch size for cursor-based pagination during exports
   * Smaller batches reduce memory pressure but increase query count
   * Can be overridden via environment variable
   */
  EXPORT_BATCH_SIZE: parseInt(process.env.ANALYTICS_EXPORT_BATCH_SIZE || '1000', 10),

  /**
   * Default cache TTL for analytics data (in seconds)
   * Can be overridden via environment variable
   */
  CACHE_TTL_SECONDS: parseInt(process.env.ANALYTICS_CACHE_TTL || '300', 10),

  /**
   * Maximum number of top URLs to return in overview analytics
   */
  TOP_URLS_LIMIT: parseInt(process.env.ANALYTICS_TOP_URLS_LIMIT || '10', 10),

  /**
   * Maximum number of recent clicks to return
   */
  RECENT_CLICKS_LIMIT: parseInt(process.env.ANALYTICS_RECENT_CLICKS_LIMIT || '100', 10),

  /**
   * Maximum number of clicks to load for in-memory analytics processing
   * If exceeded, will use database aggregation instead
   * Prevents memory exhaustion for high-traffic URLs
   */
  MAX_IN_MEMORY_CLICKS: parseInt(process.env.ANALYTICS_MAX_IN_MEMORY_CLICKS || '50000', 10),

  /**
   * Threshold for switching to database aggregation
   * When click count exceeds this, use GROUP BY queries instead of loading all data
   */
  AGGREGATION_THRESHOLD: parseInt(process.env.ANALYTICS_AGGREGATION_THRESHOLD || '10000', 10),
} as const;

// Type for the config object
export type AnalyticsConfig = typeof ANALYTICS_CONFIG;
