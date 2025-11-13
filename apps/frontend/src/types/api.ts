/**
 * API Type Definitions
 */

// ==================== Auth Types ====================

export interface LoginDto {
  email: string;
  password: string;
  turnstileToken?: string;
  twoFactorCode?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token?: string;
  user?: UserResponse;
  requires2FA: boolean;
  tempToken?: string;
}

export interface UpdateUserDto {
  name?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface Verify2FADto {
  code: string;
}

export interface Disable2FADto {
  password: string;
  code: string;
}

export interface Setup2FAResponse {
  qrCode: string;
  secret: string;
  accountName: string;
}

// ==================== URL Types ====================

export interface CreateUrlDto {
  originalUrl: string;
  turnstileToken?: string;
  customSlug?: string;
  title?: string;
  password?: string;
  expiresAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface UpdateUrlDto {
  originalUrl?: string;
  title?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  password?: string | null;
  expiresAt?: string | null;
}

export interface UrlResponse {
  id: string;
  slug: string;
  shortUrl: string;
  originalUrl: string;
  title?: string;
  userId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  clickCount: number;
  hasPassword?: boolean;
  expiresAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UrlListResponse {
  data: UrlResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UrlQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== Analytics Types ====================

export type TimeRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';

export interface AnalyticsQueryParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  clicks: number;
}

export interface GeoLocationStat {
  name: string;
  clicks: number;
  percentage: number;
}

export interface DeviceStat {
  name: string;
  clicks: number;
  percentage: number;
}

export interface RefererStat {
  referer: string;
  clicks: number;
  percentage: number;
}

export interface UtmStat {
  value: string;
  clicks: number;
  percentage: number;
}

export interface OverviewStats {
  totalClicks: number;
  uniqueVisitors: number;
  averageClicksPerDay: number;
  growthRate: number;
}

export interface AnalyticsResponse {
  overview: OverviewStats;
  timeSeries: TimeSeriesDataPoint[];
  countries: GeoLocationStat[];
  regions: GeoLocationStat[];
  cities: GeoLocationStat[];
  browsers: DeviceStat[];
  operatingSystems: DeviceStat[];
  devices: DeviceStat[];
  referers: RefererStat[];
  utmSources: UtmStat[];
  utmMediums: UtmStat[];
  utmCampaigns: UtmStat[];
}

export interface RecentClick {
  id: string;
  ip?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  city?: string;
  referer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isBot: boolean;
  botName?: string;
  createdAt: string;
}

export interface RecentClicksResponse {
  clicks: RecentClick[];
  total: number;
}

export interface BotStat {
  botName: string;
  clicks: number;
  percentage: number;
}

export interface BotAnalyticsResponse {
  totalBotClicks: number;
  botTypes: BotStat[];
}

export interface UserBotAnalyticsResponse {
  totalBotClicks: number;
  botPercentage: number;
  botTypes: BotStat[];
}

// ==================== A/B Testing Types ====================

export interface CreateVariantDto {
  name: string;
  targetUrl: string;
  weight?: number;
  isActive?: boolean;
}

export interface UpdateVariantDto {
  name?: string;
  targetUrl?: string;
  weight?: number;
  isActive?: boolean;
}

export interface VariantResponse {
  id: string;
  urlId: string;
  name: string;
  targetUrl: string;
  weight: number;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VariantStats {
  variant: VariantResponse;
  clickThroughRate: number;
  conversionRate?: number;
}

export interface VariantListResponse {
  variants: VariantResponse[];
  totalClicks: number;
  stats: VariantStats[];
}

export interface TopPerformingVariant {
  urlSlug: string;
  variantName: string;
  clicks: number;
  clickThroughRate: number;
}

export interface UserAbTestAnalyticsResponse {
  totalAbTestUrls: number;
  totalTestClicks: number;
  controlGroupClicks: number;
  variantClicks: number;
  controlGroupPercentage: number;
  variantPercentage: number;
  topPerformingVariants: TopPerformingVariant[];
}

// ==================== Webhook Types ====================

export interface CreateWebhookDto {
  name: string;
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateWebhookDto {
  name?: string;
  url?: string;
  secret?: string;
  events?: string[];
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface WebhookResponse {
  id: string;
  userId: string;
  name: string;
  url: string;
  isActive: boolean;
  events: string[];
  headers?: Record<string, string>;
  totalSent: number;
  totalSuccess: number;
  totalFailed: number;
  lastSentAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookListResponse {
  data: WebhookResponse[];
  total: number;
}

export interface WebhookLogResponse {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  statusCode?: number;
  response?: string;
  error?: string;
  duration?: number;
  attempt: number;
  isSuccess: boolean;
  createdAt: string;
}

export interface WebhookLogsListResponse {
  data: WebhookLogResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WebhookTestResponse {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  duration: number;
}

// ==================== Redirect Types ====================

export interface VerifyPasswordDto {
  password: string;
}

export interface RedirectInfoResponse {
  requiresPassword: boolean;
}

export interface VerifyPasswordResponse {
  originalUrl: string;
}

// ==================== Bundle Types ====================

export interface CreateBundleDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  urlIds?: string[];
}

export interface UpdateBundleDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface BundleUrlDto {
  id: string;
  slug: string;
  shortUrl: string;
  originalUrl: string;
  title?: string;
  clickCount: number;
  status: string;
  createdAt: string;
  order: number;
}

export interface BundleResponse {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: 'ACTIVE' | 'ARCHIVED';
  userId: string;
  urlCount: number;
  totalClicks: number;
  urls?: BundleUrlDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleListResponse {
  data: BundleResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BundleQueryDto {
  page?: number;
  pageSize?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  search?: string;
}

export interface AddUrlToBundleDto {
  urlId: string;
  order?: number;
}

export interface AddMultipleUrlsDto {
  urlIds: string[];
}

export interface BundleStatsResponse {
  bundleId: string;
  totalClicks: number;
  urlCount: number;
  topUrl?: {
    slug: string;
    clicks: number;
  };
  clickTrend: Array<{
    date: string;
    clicks: number;
  }>;
}
