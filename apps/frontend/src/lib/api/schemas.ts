/**
 * API Schema Types
 *
 * Re-exports flattened types from OpenAPI generated types.
 * Import types from this file instead of using components["schemas"]["..."] directly.
 *
 * Usage:
 *   import type { LoginDto, UserResponseDto } from '@/lib/api/schemas';
 */

import type { components } from './types';

// ==================== Auth Types ====================
export type LoginDto = components['schemas']['LoginDto'];
export type AuthResponseDto = components['schemas']['AuthResponseDto'];

export type UserResponseDto = components['schemas']['UserResponseDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];
export type ChangePasswordDto = components['schemas']['ChangePasswordDto'];
export type Setup2FAResponseDto = components['schemas']['Setup2FAResponseDto'];
export type Verify2FADto = components['schemas']['Verify2FADto'];
export type Disable2FADto = components['schemas']['Disable2FADto'];

// ==================== User Management Types ====================
export type CreateUserDto = components['schemas']['CreateUserDto'];
export type UserListResponseDto = components['schemas']['UserListResponseDto'];
export type UpdateUserRoleDto = components['schemas']['UpdateUserRoleDto'];
export type UpdateUserStatusDto = components['schemas']['UpdateUserStatusDto'];
export type ResetPasswordDto = components['schemas']['ResetPasswordDto'];

// ==================== URL Types ====================
export type CreateUrlDto = components['schemas']['CreateUrlDto'];
export type UpdateUrlDto = components['schemas']['UpdateUrlDto'];
export type UrlResponseDto = components['schemas']['UrlResponseDto'];
export type UrlListResponseDto = components['schemas']['UrlListResponseDto'];

// ==================== Variant (A/B Testing) Types ====================
export type CreateVariantDto = components['schemas']['CreateVariantDto'];
export type UpdateVariantDto = components['schemas']['UpdateVariantDto'];
export type VariantResponseDto = components['schemas']['VariantResponseDto'];
export type VariantStatsDto = components['schemas']['VariantStatsDto'];
export type VariantListResponseDto = components['schemas']['VariantListResponseDto'];

// ==================== Bulk Operation Types ====================
// Bulk Create
export interface BulkCreateUrlDto {
  urls: CreateUrlDto[];
}

export interface BulkCreateSuccessItem {
  index: number;
  url: UrlResponseDto;
}

export interface BulkCreateFailureItem {
  index: number;
  data: CreateUrlDto;
  error: string;
}

export interface BulkCreateResultDto {
  total: number;
  successCount: number;
  failureCount: number;
  succeeded: BulkCreateSuccessItem[];
  failed: BulkCreateFailureItem[];
}

// Bulk Update
export type BulkUpdateOperationType = 'status' | 'bundle' | 'expiration' | 'utm';

export interface BulkUpdateStatusOperation {
  type: 'status';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface BulkAddToBundleOperation {
  type: 'bundle';
  bundleId: string;
}

export interface BulkUpdateExpirationOperation {
  type: 'expiration';
  expiresAt?: string | null;
}

export interface BulkUpdateUtmOperation {
  type: 'utm';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export type BulkUpdateOperation =
  | BulkUpdateStatusOperation
  | BulkAddToBundleOperation
  | BulkUpdateExpirationOperation
  | BulkUpdateUtmOperation;

export interface BulkUpdateUrlDto {
  urlIds: string[];
  operation: BulkUpdateOperation;
}

export interface BulkUpdateResultDto {
  updatedCount: number;
  updatedIds: string[];
  message?: string;
}

// Bulk Delete
export interface BulkDeleteUrlDto {
  urlIds: string[];
}

export interface BulkDeleteResultDto {
  deletedCount: number;
  deletedIds: string[];
}

// ==================== Analytics Types ====================
export type AnalyticsResponseDto = components['schemas']['AnalyticsResponseDto'];
export type TimeSeriesDataPoint = components['schemas']['TimeSeriesDataPoint'];
export type GeoLocationStat = components['schemas']['GeoLocationStat'];
export type DeviceStat = components['schemas']['DeviceStat'];
export type RefererStat = components['schemas']['RefererStat'];
export type UtmStat = components['schemas']['UtmStat'];
export type OverviewStats = components['schemas']['OverviewStats'];
export type RecentClickDto = components['schemas']['RecentClickDto'];
export type RecentClicksResponseDto = components['schemas']['RecentClicksResponseDto'];
export type BotTypeStat = components['schemas']['BotTypeStat'];
export type BotAnalyticsResponseDto = components['schemas']['BotAnalyticsResponseDto'];
export type UserBotAnalyticsResponseDto = components['schemas']['UserBotAnalyticsResponseDto'];
export type TopPerformingVariant = components['schemas']['TopPerformingVariant'];
export type AbTestAnalyticsResponseDto = components['schemas']['AbTestAnalyticsResponseDto'];

// ==================== API Key Types ====================
export type CreateApiKeyDto = components['schemas']['CreateApiKeyDto'];
export type ApiKeyResponseDto = components['schemas']['ApiKeyResponseDto'];
export type CreateApiKeyResponseDto = components['schemas']['CreateApiKeyResponseDto'];
export type ApiKeyListResponseDto = components['schemas']['ApiKeyListResponseDto'];

// ==================== Bundle Types ====================
export type CreateBundleDto = components['schemas']['CreateBundleDto'];
export type UpdateBundleDto = components['schemas']['UpdateBundleDto'];
export type BundleUrlDto = components['schemas']['BundleUrlDto'];
export type BundleResponseDto = components['schemas']['BundleResponseDto'];
export type BundleListResponseDto = components['schemas']['BundleListResponseDto'];
export type TopUrlDto = components['schemas']['TopUrlDto'];
export type ClickTrendDataPoint = components['schemas']['ClickTrendDataPoint'];
export type BundleStatsDto = components['schemas']['BundleStatsDto'];
export type AddUrlToBundleDto = components['schemas']['AddUrlToBundleDto'];
export type AddMultipleUrlsDto = components['schemas']['AddMultipleUrlsDto'];

// ==================== Webhook Types ====================
export type CreateWebhookDto = components['schemas']['CreateWebhookDto'];
export type UpdateWebhookDto = components['schemas']['UpdateWebhookDto'];
export type WebhookResponseDto = components['schemas']['WebhookResponseDto'];
export type WebhookListResponseDto = components['schemas']['WebhookListResponseDto'];
export type WebhookLogResponseDto = components['schemas']['WebhookLogResponseDto'];
export type WebhookLogsListResponseDto = components['schemas']['WebhookLogsListResponseDto'];
export type WebhookTestResponseDto = components['schemas']['WebhookTestResponseDto'];

// ==================== Redirect Types ====================
export type VerifyPasswordDto = components['schemas']['VerifyPasswordDto'];
export type RedirectInfoResponseDto = components['schemas']['RedirectInfoResponseDto'];
export type VerifyPasswordResponseDto = components['schemas']['VerifyPasswordResponseDto'];

// ==================== Common Types ====================
export type SuccessResponseDto = components['schemas']['SuccessResponseDto'];
export type ErrorResponseDto = components['schemas']['ErrorResponseDto'];
export type SystemSettingsResponseDto = components['schemas']['SystemSettingsResponseDto'];

// ==================== Audit Log Types ====================
export type AuditLogUserDto = components['schemas']['AuditLogUserDto'];
export type AuditLogDto = components['schemas']['AuditLogDto'];
export type AuditLogListResponseDto = components['schemas']['AuditLogListResponseDto'];

// AuditAction type derived from AuditLogDto
export type AuditAction = AuditLogDto['action'];

// ==================== Query Parameter Types ====================
// These types are exported from OpenAPI generated schemas
// Using Partial<> since all query params are optional in API calls

export type PaginationDto = components['schemas']['PaginationDto'];
export type AnalyticsQueryDto = components['schemas']['AnalyticsQueryDto'];
export type ExportQueryDto = components['schemas']['ExportQueryDto'];
export type UrlQueryDto = components['schemas']['UrlQueryDto'];
export type BundleQueryDto = components['schemas']['BundleQueryDto'];
export type UserListQueryDto = components['schemas']['UserListQueryDto'];
export type AuditLogQueryDto = components['schemas']['AuditLogQueryDto'];

// TimeRange derived from AnalyticsQueryDto
export type TimeRange = AnalyticsQueryDto['timeRange'];

// Query params aliases (Partial since params are optional in API calls)
export type PaginationParams = Partial<PaginationDto>;
export type UrlQueryParams = Partial<UrlQueryDto>;
export type AnalyticsQueryParams = Partial<AnalyticsQueryDto>;
export type BundleQueryParams = Partial<BundleQueryDto>;
export type UserQueryParams = Partial<UserListQueryDto>;
export type AuditLogQueryParams = Partial<AuditLogQueryDto>;

// ==================== API Error Type ====================
/**
 * Type-safe API error structure for catch blocks
 * Use this instead of `any` in error handling
 */
export interface ApiError extends Error {
  message: string;
  response?: {
    status: number;
    data: {
      message?: string;
      errors?: Record<string, string[]>;
      [key: string]: unknown;
    };
  };
}
