'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_CONFIG } from '@/lib/query-config';
import type { OidcProviderPublicDto } from '@/lib/api/schemas';

// Re-export types for consumers
export type { OidcProviderPublicDto };

export const oidcKeys = {
  all: ['oidc'] as const,
  providers: () => [...oidcKeys.all, 'providers'] as const,
};

async function getOidcProviders(): Promise<OidcProviderPublicDto[]> {
  return apiClient.get<OidcProviderPublicDto[]>('/api/auth/sso');
}

export function useOidcProviders() {
  return useQuery({
    queryKey: oidcKeys.providers(),
    queryFn: getOidcProviders,
    ...QUERY_CONFIG.STATIC,
    retry: 1,
  });
}
