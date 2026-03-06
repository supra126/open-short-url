/**
 * API Type Definitions
 * Corresponds to backend API request and response formats
 */

// ==================== URL Types ====================

export interface CreateUrlRequest {
  originalUrl: string;
  customSlug?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string; // ISO 8601 date string
  status?: 'ACTIVE' | 'INACTIVE';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface UpdateUrlRequest {
  originalUrl?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface UrlResponse {
  id: string;
  slug: string;
  originalUrl: string;
  title?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  clickCount: number;
  hasPassword: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface UrlListResponse {
  data: UrlResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UrlStatsResponse {
  total: number;
  active: number;
  inactive: number;
  expired: number;
}

export interface QRCodeResponse {
  qrCode: string; // Base64 Data URL
}

// ==================== Bulk Operations ====================

export interface BulkCreateUrlRequest {
  urls: CreateUrlRequest[];
}

export interface BulkCreateResultResponse {
  total: number;
  successCount: number;
  failureCount: number;
  succeeded: Array<{ index: number; url: UrlResponse }>;
  failed: Array<{ index: number; data: CreateUrlRequest; error: string }>;
}

export type BulkUpdateOperation =
  | { type: 'status'; status: 'ACTIVE' | 'INACTIVE' }
  | { type: 'bundle'; bundleId: string }
  | { type: 'expiration'; expiresAt?: string | null }
  | {
      type: 'utm';
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
    };

export interface BulkUpdateUrlRequest {
  urlIds: string[];
  operation: BulkUpdateOperation;
}

export interface BulkUpdateResultResponse {
  updatedCount: number;
  updatedIds: string[];
  message?: string;
}

export interface BulkDeleteUrlRequest {
  urlIds: string[];
}

export interface BulkDeleteResultResponse {
  deletedCount: number;
  deletedIds: string[];
}

// ==================== Variant Types ====================

export interface CreateVariantRequest {
  name: string;
  targetUrl: string;
  weight: number;
  isActive?: boolean;
}

export interface UpdateVariantRequest {
  name?: string;
  targetUrl?: string;
  weight?: number;
  isActive?: boolean;
}

export interface VariantResponse {
  id: string;
  name: string;
  targetUrl: string;
  weight: number;
  isActive: boolean;
  clickCount: number;
  urlId: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Analytics Types ====================

export interface AnalyticsResponse {
  totalClicks: number;
  uniqueClicks?: number;
  clicksByDate: Array<{ date: string; count: number }>;
  clicksByCountry: Array<{ country: string; count: number }>;
  clicksByDevice: Array<{ device: string; count: number }>;
  clicksByBrowser: Array<{ browser: string; count: number }>;
  clicksByOs: Array<{ os: string; count: number }>;
  clicksByReferer: Array<{ referer: string; count: number }>;
  clicksByUtm?: {
    source: Array<{ source: string; count: number }>;
    medium: Array<{ medium: string; count: number }>;
    campaign: Array<{ campaign: string; count: number }>;
  };
}

export interface RecentClick {
  id: string;
  clickedAt: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referer?: string;
  isBot: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface RecentClicksResponse {
  data: RecentClick[];
  total: number;
}

export interface BotAnalyticsResponse {
  totalBotClicks: number;
  totalHumanClicks: number;
  botPercentage: number;
  botsByType: Array<{ type: string; count: number }>;
  botTrend: Array<{ date: string; botCount: number; humanCount: number }>;
}

export interface UserBotAnalyticsResponse {
  totalBotClicks: number;
  totalHumanClicks: number;
  botPercentage: number;
  topBotUrls: Array<{ urlId: string; slug: string; botClicks: number }>;
}

export interface AbTestAnalyticsResponse {
  totalTests: number;
  activeTests: number;
  totalVariants: number;
  tests: Array<{
    urlId: string;
    slug: string;
    variants: Array<{
      id: string;
      name: string;
      weight: number;
      clickCount: number;
    }>;
  }>;
}

export interface TopPerformingUrl {
  id: string;
  slug: string;
  originalUrl: string;
  title?: string;
  clickCount: number;
  uniqueClicks?: number;
}

export interface RoutingAnalyticsResponse {
  totalRoutedClicks: number;
  rules: Array<{
    ruleId: string;
    ruleName: string;
    matchCount: number;
    percentage: number;
  }>;
  routingTrend: Array<{ date: string; count: number }>;
}

// ==================== Bundle Types ====================

export interface CreateBundleRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  urlIds?: string[];
}

export interface UpdateBundleRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface BundleUrlResponse {
  id: string;
  slug: string;
  originalUrl: string;
  title?: string;
  clickCount: number;
  order: number;
  createdAt: string;
}

export interface BundleResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  urlCount: number;
  totalClicks: number;
  urls?: BundleUrlResponse[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface BundleListResponse {
  data: BundleResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BundleStatsResponse {
  bundleId: string;
  totalClicks: number;
  urlCount: number;
  topUrl?: {
    id: string;
    slug: string;
    clickCount: number;
  };
  clickTrend: Array<{ date: string; count: number }>;
}

export interface AddUrlToBundleRequest {
  urlId: string;
}

export interface AddMultipleUrlsRequest {
  urlIds: string[];
}
