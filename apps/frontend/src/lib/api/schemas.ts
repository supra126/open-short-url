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
export type ApiKeyListResponseDto = components['schemas']['ApiKeyListResponseDto'];

// CreateApiKeyResponse - API key with required key field (only returned on creation)
export interface CreateApiKeyResponseDto extends Omit<ApiKeyResponseDto, 'key'> {
  key: string; // Always returned on creation
}

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

// ==================== Query Parameter Types ====================
// These types are derived from OpenAPI operation parameters
// They are not part of components.schemas but are needed for type-safe API calls

export type TimeRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_365_days' | 'custom';

export interface UrlQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  sortBy?: 'createdAt' | 'clickCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface AnalyticsQueryParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
}

export interface BundleQueryParams {
  page?: number;
  pageSize?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  search?: string;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ==================== Type Aliases for Backward Compatibility ====================
// These aliases map the old naming convention to the new Dto suffix convention
// Can be removed once all code is migrated

/** @deprecated Use AuthResponseDto instead */
export type AuthResponse = AuthResponseDto;
/** @deprecated Use UserResponseDto instead */
export type UserResponse = UserResponseDto;
/** @deprecated Use UrlResponseDto instead */
export type UrlResponse = UrlResponseDto;
/** @deprecated Use UrlListResponseDto instead */
export type UrlListResponse = UrlListResponseDto;
/** @deprecated Use VariantResponseDto instead */
export type VariantResponse = VariantResponseDto;
/** @deprecated Use VariantListResponseDto instead */
export type VariantListResponse = VariantListResponseDto;
/** @deprecated Use AnalyticsResponseDto instead */
export type AnalyticsResponse = AnalyticsResponseDto;
/** @deprecated Use RecentClickDto instead */
export type RecentClick = RecentClickDto;
/** @deprecated Use RecentClicksResponseDto instead */
export type RecentClicksResponse = RecentClicksResponseDto;
/** @deprecated Use BotTypeStat instead */
export type BotStat = BotTypeStat;
/** @deprecated Use BotAnalyticsResponseDto instead */
export type BotAnalyticsResponse = BotAnalyticsResponseDto;
/** @deprecated Use UserBotAnalyticsResponseDto instead */
export type UserBotAnalyticsResponse = UserBotAnalyticsResponseDto;
/** @deprecated Use AbTestAnalyticsResponseDto instead */
export type UserAbTestAnalyticsResponse = AbTestAnalyticsResponseDto;
/** @deprecated Use VariantStatsDto instead */
export type VariantStats = VariantStatsDto;
/** @deprecated Use ApiKeyResponseDto instead */
export type ApiKey = ApiKeyResponseDto;
/** @deprecated Use ApiKeyListResponseDto instead */
export type ApiKeyListResponse = ApiKeyListResponseDto;
/** @deprecated Use BundleResponseDto instead */
export type BundleResponse = BundleResponseDto;
/** @deprecated Use BundleListResponseDto instead */
export type BundleListResponse = BundleListResponseDto;
/** @deprecated Use BundleStatsDto instead */
export type BundleStatsResponse = BundleStatsDto;
/** @deprecated Use WebhookResponseDto instead */
export type WebhookResponse = WebhookResponseDto;
/** @deprecated Use WebhookListResponseDto instead */
export type WebhookListResponse = WebhookListResponseDto;
/** @deprecated Use WebhookLogResponseDto instead */
export type WebhookLogResponse = WebhookLogResponseDto;
/** @deprecated Use WebhookLogsListResponseDto instead */
export type WebhookLogsListResponse = WebhookLogsListResponseDto;
/** @deprecated Use WebhookTestResponseDto instead */
export type WebhookTestResponse = WebhookTestResponseDto;
/** @deprecated Use Setup2FAResponseDto instead */
export type Setup2FAResponse = Setup2FAResponseDto;
/** @deprecated Use RedirectInfoResponseDto instead */
export type RedirectInfoResponse = RedirectInfoResponseDto;
/** @deprecated Use VerifyPasswordResponseDto instead */
export type VerifyPasswordResponse = VerifyPasswordResponseDto;
/** @deprecated Use BundleQueryParams instead */
export type BundleQueryDto = BundleQueryParams;
