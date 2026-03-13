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

// ==================== Pagination ====================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== Routing Rule Types ====================

export type ConditionType =
  | 'COUNTRY'
  | 'REGION'
  | 'CITY'
  | 'DEVICE'
  | 'OS'
  | 'BROWSER'
  | 'LANGUAGE'
  | 'REFERER'
  | 'TIME'
  | 'DAY_OF_WEEK'
  | 'UTM_SOURCE'
  | 'UTM_MEDIUM'
  | 'UTM_CAMPAIGN'
  | 'UTM_TERM'
  | 'UTM_CONTENT';

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'IN'
  | 'NOT_IN'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'BETWEEN'
  | 'BEFORE'
  | 'AFTER';

export type LogicalOperator = 'AND' | 'OR';

export interface TimeRangeValue {
  start: string;
  end?: string;
  timezone?: string;
}

export interface ConditionItem {
  type: ConditionType;
  operator: ConditionOperator;
  value: string | string[] | TimeRangeValue;
}

export interface RoutingConditions {
  operator: LogicalOperator;
  conditions: ConditionItem[];
}

export interface CreateRoutingRuleRequest {
  name: string;
  targetUrl: string;
  priority?: number;
  isActive?: boolean;
  conditions: RoutingConditions;
}

export interface UpdateRoutingRuleRequest {
  name?: string;
  targetUrl?: string;
  priority?: number;
  isActive?: boolean;
  conditions?: RoutingConditions;
}

export interface RoutingRuleResponse {
  id: string;
  urlId: string;
  name: string;
  targetUrl: string;
  priority: number;
  isActive: boolean;
  conditions: RoutingConditions;
  matchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingRuleStatResponse {
  ruleId: string;
  name: string;
  matchCount: number;
  matchPercentage: number;
}

export interface RoutingRulesListResponse {
  rules: RoutingRuleResponse[];
  totalMatches: number;
  stats: RoutingRuleStatResponse[];
}

export interface UpdateSmartRoutingSettingsRequest {
  isSmartRouting?: boolean;
  defaultUrl?: string | null;
}

export interface SmartRoutingSettingsResponse {
  isSmartRouting: boolean;
  defaultUrl: string | null;
}

export interface CreateFromTemplateRequest {
  templateKey: string;
  targetUrl: string;
  name?: string;
  priority?: number;
}

export interface RoutingTemplate {
  key: string;
  name: string;
  description: string;
  conditions: RoutingConditions;
}

export interface TemplateListResponse {
  templates: RoutingTemplate[];
}

// ==================== Webhook Types ====================

export interface CreateWebhookRequest {
  name: string;
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateWebhookRequest {
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
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface WebhookLogResponse {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
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
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface WebhookTestResponse {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  duration: number;
}

// ==================== User Types ====================

export type UserRole = 'ADMIN' | 'USER';

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface UpdateUserNameRequest {
  name?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: UserResponse[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface OidcAccountProviderInfo {
  name: string;
  slug: string;
}

export interface OidcAccountResponse {
  id: string;
  providerId: string;
  sub: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  provider: OidcAccountProviderInfo;
}

// ==================== API Key Types ====================

export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  key?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  key: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyListResponse {
  data: ApiKeyResponse[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== OIDC Provider Types ====================

export interface CreateOidcProviderRequest {
  name: string;
  slug: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  scopes?: string;
  isActive?: boolean;
}

export interface UpdateOidcProviderRequest {
  name?: string;
  discoveryUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  isActive?: boolean;
}

export interface OidcProviderResponse {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  discoveryUrl: string;
  clientId: string;
  hasClientSecret: boolean;
  scopes: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Settings Types ====================

export interface UpdateSystemSettingRequest {
  value: unknown;
  description?: string;
}

export interface SystemSettingResponse {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Audit Log Types ====================

export interface AuditLogUserInfo {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuditLogEntry {
  id: string;
  user?: AuditLogUserInfo | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  data: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== Analytics Export Types ====================

export type ExportFormat = 'csv' | 'json';

export type TimeRange =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_365_days'
  | 'custom';

export interface ExportQueryParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  format?: ExportFormat;
  includeClicks?: boolean;
}
