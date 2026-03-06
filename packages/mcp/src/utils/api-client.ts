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

  constructor(baseUrl: string, auth: string | { apiKey?: string; cookies?: string }) {
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
      ...options.headers as Record<string, string>,
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
   * Build query string from params object
   */
  private buildQuery(params?: Record<string, unknown> | object): string {
    if (!params) return '';
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
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

  async bulkCreateUrls(data: BulkCreateUrlRequest): Promise<BulkCreateResultResponse> {
    return this.request<BulkCreateResultResponse>('/api/urls/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkUpdateUrls(data: BulkUpdateUrlRequest): Promise<BulkUpdateResultResponse> {
    return this.request<BulkUpdateResultResponse>('/api/urls/bulk', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteUrls(data: BulkDeleteUrlRequest): Promise<BulkDeleteResultResponse> {
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

  async updateBundle(id: string, data: UpdateBundleRequest): Promise<BundleResponse> {
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

  async removeUrlFromBundle(bundleId: string, urlId: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/urls/${urlId}`, {
      method: 'DELETE',
    });
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
}
