/**
 * Open Short URL API Client
 * Handles communication with the backend API
 */

import type {
  CreateUrlRequest,
  UpdateUrlRequest,
  UrlResponse,
  UrlListResponse,
  UrlStatsResponse,
  BulkCreateUrlRequest,
  BulkCreateResultResponse,
  BulkUpdateUrlRequest,
  BulkUpdateResultResponse,
  BulkDeleteUrlRequest,
  BulkDeleteResultResponse,
  CreateVariantRequest,
  UpdateVariantRequest,
  VariantResponse,
  AnalyticsResponse,
  RecentClicksResponse,
  BotAnalyticsResponse,
  UserBotAnalyticsResponse,
  AbTestAnalyticsResponse,
  TopPerformingUrl,
  RoutingAnalyticsResponse,
  QRCodeResponse,
  CreateBundleRequest,
  UpdateBundleRequest,
  BundleResponse,
  BundleListResponse,
  BundleStatsResponse,
  AddUrlToBundleRequest,
  AddMultipleUrlsRequest,
  CreateRoutingRuleRequest,
  UpdateRoutingRuleRequest,
  RoutingRuleResponse,
  RoutingRulesListResponse,
  UpdateSmartRoutingSettingsRequest,
  SmartRoutingSettingsResponse,
  CreateFromTemplateRequest,
  TemplateListResponse,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookResponse,
  WebhookListResponse,
  WebhookLogsListResponse,
  WebhookTestResponse,
  WebhookLogResponse,
  CreateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  UpdateUserNameRequest,
  ResetPasswordRequest,
  UserResponse,
  UserListResponse,
  OidcAccountResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ApiKeyListResponse,
  CreateOidcProviderRequest,
  UpdateOidcProviderRequest,
  OidcProviderResponse,
  UpdateSystemSettingRequest,
  SystemSettingResponse,
  AuditLogListResponse,
  ExportQueryParams,
} from '../types/api.js';

interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private cookies?: string;

  constructor(
    baseUrl: string,
    auth: string | { apiKey?: string; cookies?: string }
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

    // Support both string (apiKey) and object (apiKey or cookies) for auth
    if (typeof auth === 'string') {
      this.apiKey = auth;
    } else {
      this.apiKey = auth.apiKey;
      this.cookies = auth.cookies;
    }
  }

  /**
   * Generic method for sending HTTP requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Build headers with either API Key or Cookie authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Use Cookie authentication if available, otherwise fall back to API Key
    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make an authenticated request and return the response as text.
   * Used for endpoints that return non-JSON content (e.g., CSV export).
   */
  private async requestText(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    return response.text();
  }

  /**
   * Build query string from params object
   */
  private buildQuery(params?: Record<string, unknown> | object): string {
    if (!params) return '';
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(
      params as Record<string, unknown>
    )) {
      if (value !== undefined && value !== null) {
        queryParams.set(key, String(value));
      }
    }
    const query = queryParams.toString();
    return query ? `?${query}` : '';
  }

  // ==================== URL Management ====================

  async createUrl(data: CreateUrlRequest): Promise<UrlResponse> {
    return this.request<UrlResponse>('/api/urls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listUrls(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UrlListResponse> {
    return this.request<UrlListResponse>(`/api/urls${this.buildQuery(params)}`);
  }

  async getUrl(id: string): Promise<UrlResponse> {
    return this.request<UrlResponse>(`/api/urls/${id}`);
  }

  async updateUrl(id: string, data: UpdateUrlRequest): Promise<UrlResponse> {
    return this.request<UrlResponse>(`/api/urls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUrl(id: string): Promise<void> {
    return this.request<void>(`/api/urls/${id}`, {
      method: 'DELETE',
    });
  }

  async getUrlStats(): Promise<UrlStatsResponse> {
    return this.request<UrlStatsResponse>('/api/urls/stats');
  }

  async generateQRCode(
    id: string,
    options?: { width?: number; color?: string }
  ): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>(
      `/api/urls/${id}/qrcode${this.buildQuery(options)}`
    );
  }

  // ==================== Bulk Operations ====================

  async bulkCreateUrls(
    data: BulkCreateUrlRequest
  ): Promise<BulkCreateResultResponse> {
    return this.request<BulkCreateResultResponse>('/api/urls/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkUpdateUrls(
    data: BulkUpdateUrlRequest
  ): Promise<BulkUpdateResultResponse> {
    return this.request<BulkUpdateResultResponse>('/api/urls/bulk', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteUrls(
    data: BulkDeleteUrlRequest
  ): Promise<BulkDeleteResultResponse> {
    return this.request<BulkDeleteResultResponse>('/api/urls/bulk', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // ==================== A/B Testing Variant Management ====================

  async createVariant(
    urlId: string,
    data: CreateVariantRequest
  ): Promise<VariantResponse> {
    return this.request<VariantResponse>(`/api/urls/${urlId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listVariants(urlId: string): Promise<{ data: VariantResponse[] }> {
    return this.request<{ data: VariantResponse[] }>(
      `/api/urls/${urlId}/variants`
    );
  }

  async getVariant(urlId: string, variantId: string): Promise<VariantResponse> {
    return this.request<VariantResponse>(
      `/api/urls/${urlId}/variants/${variantId}`
    );
  }

  async updateVariant(
    urlId: string,
    variantId: string,
    data: UpdateVariantRequest
  ): Promise<VariantResponse> {
    return this.request<VariantResponse>(
      `/api/urls/${urlId}/variants/${variantId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteVariant(urlId: string, variantId: string): Promise<void> {
    return this.request<void>(`/api/urls/${urlId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Analytics ====================

  async getUrlAnalytics(
    urlId: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>(
      `/api/analytics/urls/${urlId}${this.buildQuery(params)}`
    );
  }

  async getOverviewAnalytics(
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>(
      `/api/analytics/overview${this.buildQuery(params)}`
    );
  }

  async getTopPerformingUrls(
    params?: AnalyticsQueryParams & { limit?: number }
  ): Promise<TopPerformingUrl[]> {
    return this.request<TopPerformingUrl[]>(
      `/api/analytics/top-urls${this.buildQuery(params)}`
    );
  }

  async getRecentClicks(
    urlId: string,
    params?: { limit?: number; includeBots?: boolean }
  ): Promise<RecentClicksResponse> {
    return this.request<RecentClicksResponse>(
      `/api/analytics/urls/${urlId}/recent-clicks${this.buildQuery(params)}`
    );
  }

  async getBotAnalytics(
    urlId: string,
    params?: AnalyticsQueryParams
  ): Promise<BotAnalyticsResponse> {
    return this.request<BotAnalyticsResponse>(
      `/api/analytics/urls/${urlId}/bots${this.buildQuery(params)}`
    );
  }

  async getUserBotAnalytics(
    params?: AnalyticsQueryParams
  ): Promise<UserBotAnalyticsResponse> {
    return this.request<UserBotAnalyticsResponse>(
      `/api/analytics/bots${this.buildQuery(params)}`
    );
  }

  async getAbTestAnalytics(
    params?: AnalyticsQueryParams
  ): Promise<AbTestAnalyticsResponse> {
    return this.request<AbTestAnalyticsResponse>(
      `/api/analytics/ab-tests${this.buildQuery(params)}`
    );
  }

  async getRoutingAnalytics(
    urlId: string,
    params?: AnalyticsQueryParams
  ): Promise<RoutingAnalyticsResponse> {
    return this.request<RoutingAnalyticsResponse>(
      `/api/analytics/urls/${urlId}/routing${this.buildQuery(params)}`
    );
  }

  // ==================== Bundle Management ====================

  async createBundle(data: CreateBundleRequest): Promise<BundleResponse> {
    return this.request<BundleResponse>('/api/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listBundles(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<BundleListResponse> {
    return this.request<BundleListResponse>(
      `/api/bundles${this.buildQuery(params)}`
    );
  }

  async getBundle(id: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${id}`);
  }

  async updateBundle(
    id: string,
    data: UpdateBundleRequest
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBundle(id: string): Promise<void> {
    return this.request<void>(`/api/bundles/${id}`, {
      method: 'DELETE',
    });
  }

  async addUrlToBundle(
    bundleId: string,
    data: AddUrlToBundleRequest
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/urls`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addMultipleUrlsToBundle(
    bundleId: string,
    data: AddMultipleUrlsRequest
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/urls/batch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeUrlFromBundle(
    bundleId: string,
    urlId: string
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(
      `/api/bundles/${bundleId}/urls/${urlId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async updateUrlOrder(
    bundleId: string,
    urlId: string,
    order: number
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(
      `/api/bundles/${bundleId}/urls/${urlId}/order`,
      {
        method: 'PATCH',
        body: JSON.stringify({ order }),
      }
    );
  }

  async getBundleStats(bundleId: string): Promise<BundleStatsResponse> {
    return this.request<BundleStatsResponse>(`/api/bundles/${bundleId}/stats`);
  }

  async archiveBundle(bundleId: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/archive`, {
      method: 'POST',
    });
  }

  async restoreBundle(bundleId: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/restore`, {
      method: 'POST',
    });
  }

  // ==================== Routing Rules ====================

  async createRoutingRule(
    urlId: string,
    data: CreateRoutingRuleRequest
  ): Promise<RoutingRuleResponse> {
    return this.request<RoutingRuleResponse>(
      `/api/urls/${urlId}/routing-rules`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async createRoutingRuleFromTemplate(
    urlId: string,
    data: CreateFromTemplateRequest
  ): Promise<RoutingRuleResponse> {
    return this.request<RoutingRuleResponse>(
      `/api/urls/${urlId}/routing-rules/from-template`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  async listRoutingRules(urlId: string): Promise<RoutingRulesListResponse> {
    return this.request<RoutingRulesListResponse>(
      `/api/urls/${urlId}/routing-rules`
    );
  }

  async getRoutingRule(
    urlId: string,
    ruleId: string
  ): Promise<RoutingRuleResponse> {
    return this.request<RoutingRuleResponse>(
      `/api/urls/${urlId}/routing-rules/${ruleId}`
    );
  }

  async updateRoutingRule(
    urlId: string,
    ruleId: string,
    data: UpdateRoutingRuleRequest
  ): Promise<RoutingRuleResponse> {
    return this.request<RoutingRuleResponse>(
      `/api/urls/${urlId}/routing-rules/${ruleId}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  }

  async deleteRoutingRule(urlId: string, ruleId: string): Promise<void> {
    return this.request<void>(`/api/urls/${urlId}/routing-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async updateSmartRoutingSettings(
    urlId: string,
    data: UpdateSmartRoutingSettingsRequest
  ): Promise<SmartRoutingSettingsResponse> {
    return this.request<SmartRoutingSettingsResponse>(
      `/api/urls/${urlId}/routing-rules/settings`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
  }

  async getRoutingTemplates(): Promise<TemplateListResponse> {
    return this.request<TemplateListResponse>('/api/routing-templates');
  }

  // ==================== Webhooks ====================

  async createWebhook(data: CreateWebhookRequest): Promise<WebhookResponse> {
    return this.request<WebhookResponse>('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listWebhooks(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<WebhookListResponse> {
    return this.request<WebhookListResponse>(
      `/api/webhooks${this.buildQuery(params)}`
    );
  }

  async getWebhook(id: string): Promise<WebhookResponse> {
    return this.request<WebhookResponse>(`/api/webhooks/${id}`);
  }

  async updateWebhook(
    id: string,
    data: UpdateWebhookRequest
  ): Promise<WebhookResponse> {
    return this.request<WebhookResponse>(`/api/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    return this.request<void>(`/api/webhooks/${id}`, { method: 'DELETE' });
  }

  async getWebhookLogs(
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<WebhookLogsListResponse> {
    return this.request<WebhookLogsListResponse>(
      `/api/webhooks/${id}/logs${this.buildQuery(params)}`
    );
  }

  async testWebhook(id: string): Promise<WebhookTestResponse> {
    return this.request<WebhookTestResponse>(`/api/webhooks/${id}/test`, {
      method: 'POST',
    });
  }

  async retryWebhookDelivery(
    webhookId: string,
    logId: string
  ): Promise<WebhookLogResponse> {
    return this.request<WebhookLogResponse>(
      `/api/webhooks/${webhookId}/logs/${logId}/retry`,
      { method: 'POST' }
    );
  }

  // ==================== User Management (Admin) ====================

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListResponse> {
    return this.request<UserListResponse>(
      `/api/users${this.buildQuery(params)}`
    );
  }

  async getUser(id: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${id}`);
  }

  async updateUserRole(
    id: string,
    data: UpdateUserRoleRequest
  ): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(
    id: string,
    data: UpdateUserStatusRequest
  ): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, { method: 'DELETE' });
  }

  async resetUserPassword(
    id: string,
    data: ResetPasswordRequest
  ): Promise<void> {
    return this.request<void>(`/api/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserName(
    id: string,
    data: UpdateUserNameRequest
  ): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${id}/name`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async disableUser2FA(id: string): Promise<void> {
    return this.request<void>(`/api/users/${id}/2fa`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: false }),
    });
  }

  async getUserOidcAccounts(id: string): Promise<OidcAccountResponse[]> {
    return this.request<OidcAccountResponse[]>(
      `/api/users/${id}/oidc-accounts`
    );
  }

  async unlinkUserOidcAccount(
    userId: string,
    accountId: string
  ): Promise<void> {
    return this.request<void>(
      `/api/users/${userId}/oidc-accounts/${accountId}`,
      { method: 'DELETE' }
    );
  }

  // ==================== API Keys ====================

  async createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.request<CreateApiKeyResponse>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listApiKeys(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiKeyListResponse> {
    return this.request<ApiKeyListResponse>(
      `/api/api-keys${this.buildQuery(params)}`
    );
  }

  async getApiKey(id: string): Promise<CreateApiKeyResponse> {
    return this.request<CreateApiKeyResponse>(`/api/api-keys/${id}`);
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request<void>(`/api/api-keys/${id}`, { method: 'DELETE' });
  }

  // ==================== OIDC Providers (Admin) ====================

  async listOidcProviders(): Promise<OidcProviderResponse[]> {
    return this.request<OidcProviderResponse[]>('/api/admin/oidc-providers');
  }

  async createOidcProvider(
    data: CreateOidcProviderRequest
  ): Promise<OidcProviderResponse> {
    return this.request<OidcProviderResponse>('/api/admin/oidc-providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOidcProvider(slug: string): Promise<OidcProviderResponse> {
    return this.request<OidcProviderResponse>(
      `/api/admin/oidc-providers/${slug}`
    );
  }

  async updateOidcProvider(
    slug: string,
    data: UpdateOidcProviderRequest
  ): Promise<OidcProviderResponse> {
    return this.request<OidcProviderResponse>(
      `/api/admin/oidc-providers/${slug}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  }

  async deleteOidcProvider(slug: string): Promise<void> {
    return this.request<void>(`/api/admin/oidc-providers/${slug}`, {
      method: 'DELETE',
    });
  }

  // ==================== Settings (Admin) ====================

  async getSystemSettings(): Promise<SystemSettingResponse[]> {
    return this.request<SystemSettingResponse[]>('/api/settings/system');
  }

  async getSystemSetting(key: string): Promise<SystemSettingResponse> {
    return this.request<SystemSettingResponse>(`/api/settings/system/${key}`);
  }

  async updateSystemSetting(
    key: string,
    data: UpdateSystemSettingRequest
  ): Promise<SystemSettingResponse> {
    return this.request<SystemSettingResponse>(`/api/settings/system/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSystemSetting(key: string): Promise<void> {
    return this.request<void>(`/api/settings/system/${key}`, {
      method: 'DELETE',
    });
  }

  // ==================== Audit Logs (Admin) ====================

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AuditLogListResponse> {
    return this.request<AuditLogListResponse>(
      `/api/audit-logs${this.buildQuery(params)}`
    );
  }

  // ==================== Analytics Export ====================

  async exportUrlAnalytics(
    urlId: string,
    params?: ExportQueryParams
  ): Promise<string> {
    const query = this.buildQuery(params);
    return this.requestText(`/api/analytics/urls/${urlId}/export${query}`);
  }

  async exportAllAnalytics(params?: ExportQueryParams): Promise<string> {
    const query = this.buildQuery(params);
    return this.requestText(`/api/analytics/export${query}`);
  }
}
