/**
 * API Keys Types
 */

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  key?: string; // Full API Key (only returned on creation)
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyListResponse {
  data: ApiKey[];
  total: number;
}

export interface CreateApiKeyDto {
  name: string;
  expiresAt?: string; // ISO 8601 format
}

export interface CreateApiKeyResponse extends ApiKey {
  key: string; // Always returns the full key on creation
}
