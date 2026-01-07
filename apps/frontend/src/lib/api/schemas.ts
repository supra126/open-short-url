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
export type UrlStatus = components['schemas']['UrlStatus'];
export type DashboardStatsResponseDto = components['schemas']['DashboardStatsResponseDto'];
export type TopPerformingUrlDto = components['schemas']['TopPerformingUrlDto'];

// ==================== Variant (A/B Testing) Types ====================
export type CreateVariantDto = components['schemas']['CreateVariantDto'];
export type UpdateVariantDto = components['schemas']['UpdateVariantDto'];
export type VariantResponseDto = components['schemas']['VariantResponseDto'];
export type VariantStatsDto = components['schemas']['VariantStatsDto'];
export type VariantListResponseDto = components['schemas']['VariantListResponseDto'];

// ==================== Smart Routing Types ====================
// Condition and Routing types from OpenAPI
export type TimeRangeDto = components['schemas']['TimeRangeDto'];
export type ConditionItemDto = components['schemas']['ConditionItemDto'];
export type RoutingConditionsDto = components['schemas']['RoutingConditionsDto'];
export type CreateRoutingRuleDto = components['schemas']['CreateRoutingRuleDto'];
export type UpdateRoutingRuleDto = components['schemas']['UpdateRoutingRuleDto'];
export type RoutingRuleResponseDto = components['schemas']['RoutingRuleResponseDto'];
export type RoutingRuleStatDto = components['schemas']['RoutingRuleStatDto'];
export type RoutingRulesListResponseDto = components['schemas']['RoutingRulesListResponseDto'];
export type UpdateSmartRoutingSettingsDto = components['schemas']['UpdateSmartRoutingSettingsDto'];
export type SmartRoutingSettingsResponseDto = components['schemas']['SmartRoutingSettingsResponseDto'];
export type CreateFromTemplateDto = components['schemas']['CreateFromTemplateDto'];
export type RoutingTemplateDto = components['schemas']['RoutingTemplateDto'];
export type TemplateListResponseDto = components['schemas']['TemplateListResponseDto'];

// Routing Analytics types from OpenAPI
export type RoutingRuleStat = components['schemas']['RoutingRuleStat'];
export type RoutingRuleTimeSeriesDataPoint = components['schemas']['RoutingRuleTimeSeriesDataPoint'];
export type RoutingRuleGeoStat = components['schemas']['RoutingRuleGeoStat'];
export type RoutingRuleDeviceStat = components['schemas']['RoutingRuleDeviceStat'];
export type RoutingAnalyticsResponseDto = components['schemas']['RoutingAnalyticsResponseDto'];

// Derived types for convenience (extracted from ConditionItemDto)
export type ConditionType = ConditionItemDto['type'];
export type ConditionOperator = ConditionItemDto['operator'];
export type LogicalOperator = RoutingConditionsDto['operator'];

// Device and time-related types from OpenAPI
export type DeviceType = components['schemas']['DeviceType'];
export type DayOfWeek = components['schemas']['DayOfWeek'];

// Legacy alias for backwards compatibility
export type RoutingRuleAnalyticsStat = RoutingRuleStat;
export type RoutingTimeRange = TimeRangeDto;

// ==================== Bulk Operation Types ====================
// Bulk Create types from OpenAPI
export type BulkCreateUrlDto = components['schemas']['BulkCreateUrlDto'];
export type BulkCreateSuccessItem = components['schemas']['BulkCreateSuccessItem'];
export type BulkCreateFailureItem = components['schemas']['BulkCreateFailureItem'];
export type BulkCreateResultDto = components['schemas']['BulkCreateResultDto'];

// Bulk Update types from OpenAPI
export type BulkUpdateStatusDto = components['schemas']['BulkUpdateStatusDto'];
export type BulkAddToBundleDto = components['schemas']['BulkAddToBundleDto'];
export type BulkUpdateExpirationDto = components['schemas']['BulkUpdateExpirationDto'];
export type BulkUpdateUtmDto = components['schemas']['BulkUpdateUtmDto'];
export type BulkUpdateUrlDto = components['schemas']['BulkUpdateUrlDto'];
export type BulkUpdateResultDto = components['schemas']['BulkUpdateResultDto'];

// Bulk Delete types from OpenAPI
export type BulkDeleteUrlDto = components['schemas']['BulkDeleteUrlDto'];
export type BulkDeleteResultDto = components['schemas']['BulkDeleteResultDto'];

// Convenience type aliases for bulk operations
// Derived from OpenAPI generated types
export type BulkUpdateOperation =
  | BulkUpdateStatusDto
  | BulkAddToBundleDto
  | BulkUpdateExpirationDto
  | BulkUpdateUtmDto;
export type BulkUpdateOperationType = BulkUpdateOperation['type'];

// Legacy type aliases for backwards compatibility
export type BulkUpdateStatusOperation = BulkUpdateStatusDto;
export type BulkAddToBundleOperation = BulkAddToBundleDto;
export type BulkUpdateExpirationOperation = BulkUpdateExpirationDto;
export type BulkUpdateUtmOperation = BulkUpdateUtmDto;

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
export type ExportFormat = components['schemas']['ExportFormat'];
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
export type ExportQueryParams = Partial<ExportQueryDto>;

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
