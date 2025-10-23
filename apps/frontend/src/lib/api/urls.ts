import { apiClient } from '@/lib/api-client';
// TODO: Replace with generated types after running yarn generate:api-types
import type {
  UrlListResponse,
  UrlResponse,
  CreateUrlDto,
  UpdateUrlDto,
} from './types-placeholder';

/**
 * URLs API Client
 * - Pure HTTP requests without state management
 * - Called by React Query Hooks
 */
export const urlsApi = {
  /**
   * GET /api/urls - Get URL list
   */
  getUrls: async (): Promise<UrlListResponse> => {
    return apiClient.get('/api/urls');
  },

  /**
   * GET /api/urls/:id - Get single URL
   */
  getUrl: async (id: string): Promise<UrlResponse> => {
    return apiClient.get(`/api/urls/${id}`);
  },

  /**
   * POST /api/urls - Create URL
   */
  createUrl: async (dto: CreateUrlDto): Promise<UrlResponse> => {
    return apiClient.post('/api/urls', dto);
  },

  /**
   * PATCH /api/urls/:id - Update URL
   */
  updateUrl: async (id: string, dto: UpdateUrlDto): Promise<UrlResponse> => {
    return apiClient.patch(`/api/urls/${id}`, dto);
  },

  /**
   * DELETE /api/urls/:id - Delete URL
   */
  deleteUrl: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/urls/${id}`);
  },
};
