/**
 * API Types Placeholder
 *
 * This file will be replaced by auto-generated types from OpenAPI spec.
 * Run: yarn generate:api-types
 *
 * Generated file location: ./types.ts
 */

// Temporary type definitions until OpenAPI generation is set up

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface Url {
  id: string;
  slug: string;
  originalUrl: string;
  title?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  clickCount: number;
  userId: string;
  password?: string;
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
  data: Url[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UrlResponse {
  data: Url;
}

export interface CreateUrlDto {
  originalUrl: string;
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
  password?: string;
  expiresAt?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
