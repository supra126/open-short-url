/**
 * Open Short URL API Client
 * Handles communication with the backend API
 */

import type {
  CreateUrlRequest,
  UpdateUrlRequest,
  UrlResponse,
  UrlListResponse,
  CreateVariantRequest,
  UpdateVariantRequest,
  VariantResponse,
  AnalyticsResponse,
  RecentClicksResponse,
  QRCodeResponse,
  CreateBundleRequest,
  UpdateBundleRequest,
  BundleResponse,
  BundleListResponse,
  BundleStatsResponse,
  AddUrlToBundleRequest,
  AddMultipleUrlsRequest,
} from '../types/api.js';

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

  // ==================== URL Management ====================

  /**
   * Create a short URL
   */
  async createUrl(data: CreateUrlRequest): Promise<UrlResponse> {
    return this.request<UrlResponse>('/api/urls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * List all short URLs
   */
  async listUrls(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UrlListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return this.request<UrlListResponse>(
      `/api/urls${query ? '?' + query : ''}`
    );
  }

  /**
   * Get a single short URL
   */
  async getUrl(id: string): Promise<UrlResponse> {
    return this.request<UrlResponse>(`/api/urls/${id}`);
  }

  /**
   * Update a short URL
   */
  async updateUrl(id: string, data: UpdateUrlRequest): Promise<UrlResponse> {
    return this.request<UrlResponse>(`/api/urls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a short URL
   */
  async deleteUrl(id: string): Promise<void> {
    return this.request<void>(`/api/urls/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Generate QR code
   */
  async generateQRCode(
    id: string,
    options?: { width?: number; color?: string }
  ): Promise<QRCodeResponse> {
    const queryParams = new URLSearchParams();
    if (options?.width) queryParams.set('width', options.width.toString());
    if (options?.color) queryParams.set('color', options.color);

    const query = queryParams.toString();
    return this.request<QRCodeResponse>(
      `/api/urls/${id}/qrcode${query ? '?' + query : ''}`
    );
  }

  // ==================== A/B Testing Variant Management ====================

  /**
   * Create a variant
   */
  async createVariant(
    urlId: string,
    data: CreateVariantRequest
  ): Promise<VariantResponse> {
    return this.request<VariantResponse>(`/api/urls/${urlId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * List all variants
   */
  async listVariants(urlId: string): Promise<{ data: VariantResponse[] }> {
    return this.request<{ data: VariantResponse[] }>(
      `/api/urls/${urlId}/variants`
    );
  }

  /**
   * Get a single variant
   */
  async getVariant(urlId: string, variantId: string): Promise<VariantResponse> {
    return this.request<VariantResponse>(
      `/api/urls/${urlId}/variants/${variantId}`
    );
  }

  /**
   * Update a variant
   */
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

  /**
   * Delete a variant
   */
  async deleteVariant(urlId: string, variantId: string): Promise<void> {
    return this.request<void>(`/api/urls/${urlId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Analytics ====================

  /**
   * Get URL analytics
   */
  async getUrlAnalytics(
    urlId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      timezone?: string;
    }
  ): Promise<AnalyticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.timezone) queryParams.set('timezone', params.timezone);

    const query = queryParams.toString();
    return this.request<AnalyticsResponse>(
      `/api/analytics/urls/${urlId}${query ? '?' + query : ''}`
    );
  }

  /**
   * Get overview analytics for all URLs
   */
  async getOverviewAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    timezone?: string;
  }): Promise<AnalyticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.timezone) queryParams.set('timezone', params.timezone);

    const query = queryParams.toString();
    return this.request<AnalyticsResponse>(
      `/api/analytics/overview${query ? '?' + query : ''}`
    );
  }

  /**
   * Get recent clicks
   */
  async getRecentClicks(
    urlId: string,
    params?: { limit?: number; includeBots?: boolean }
  ): Promise<RecentClicksResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.includeBots !== undefined) {
      queryParams.set('includeBots', params.includeBots.toString());
    }

    const query = queryParams.toString();
    return this.request<RecentClicksResponse>(
      `/api/analytics/urls/${urlId}/recent-clicks${query ? '?' + query : ''}`
    );
  }

  /**
   * Get bot analytics
   */
  async getBotAnalytics(
    urlId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      timezone?: string;
    }
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.timezone) queryParams.set('timezone', params.timezone);

    const query = queryParams.toString();
    return this.request<any>(
      `/api/analytics/urls/${urlId}/bots${query ? '?' + query : ''}`
    );
  }

  /**
   * Get bot analytics for all URLs
   */
  async getUserBotAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    timezone?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.timezone) queryParams.set('timezone', params.timezone);

    const query = queryParams.toString();
    return this.request<any>(
      `/api/analytics/bots${query ? '?' + query : ''}`
    );
  }

  /**
   * Get A/B test analytics
   */
  async getAbTestAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    timezone?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.timezone) queryParams.set('timezone', params.timezone);

    const query = queryParams.toString();
    return this.request<any>(
      `/api/analytics/ab-tests${query ? '?' + query : ''}`
    );
  }

  // ==================== Bundle Management ====================

  /**
   * Create a bundle
   */
  async createBundle(data: CreateBundleRequest): Promise<BundleResponse> {
    return this.request<BundleResponse>('/api/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * List all bundles
   */
  async listBundles(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<BundleListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request<BundleListResponse>(
      `/api/bundles${query ? '?' + query : ''}`
    );
  }

  /**
   * Get a single bundle
   */
  async getBundle(id: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${id}`);
  }

  /**
   * Update a bundle
   */
  async updateBundle(id: string, data: UpdateBundleRequest): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a bundle
   */
  async deleteBundle(id: string): Promise<void> {
    return this.request<void>(`/api/bundles/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Add a URL to bundle
   */
  async addUrlToBundle(
    bundleId: string,
    data: AddUrlToBundleRequest
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/urls`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Add multiple URLs to bundle
   */
  async addMultipleUrlsToBundle(
    bundleId: string,
    data: AddMultipleUrlsRequest
  ): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/urls/batch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove URL from bundle
   */
  async removeUrlFromBundle(bundleId: string, urlId: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/urls/${urlId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update URL order in bundle
   */
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

  /**
   * Get bundle statistics
   */
  async getBundleStats(bundleId: string): Promise<BundleStatsResponse> {
    return this.request<BundleStatsResponse>(`/api/bundles/${bundleId}/stats`);
  }

  /**
   * Archive a bundle
   */
  async archiveBundle(bundleId: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/archive`, {
      method: 'PATCH',
    });
  }

  /**
   * Restore a bundle
   */
  async restoreBundle(bundleId: string): Promise<BundleResponse> {
    return this.request<BundleResponse>(`/api/bundles/${bundleId}/restore`, {
      method: 'PATCH',
    });
  }
}
