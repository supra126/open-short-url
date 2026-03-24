'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { urlKeys } from '@/hooks/use-url';
import { QUERY_CONFIG } from '@/lib/query-config';
import type { UtmFieldName } from '@/lib/api/schemas';

export interface UtmSuggestionItem {
  value: string;
  count: number;
}

export const utmSuggestionKeys = {
  field: (field: UtmFieldName) =>
    [...urlKeys.all, 'utm-suggestions', field] as const,
};

async function fetchUtmSuggestions(
  field: UtmFieldName
): Promise<UtmSuggestionItem[]> {
  const res = await apiClient.get<{
    field: string;
    suggestions: UtmSuggestionItem[];
  }>(`/api/urls/utm-suggestions?field=${field}`);
  return res.suggestions;
}

export function useUtmSuggestions(field: UtmFieldName) {
  return useQuery({
    queryKey: utmSuggestionKeys.field(field),
    queryFn: () => fetchUtmSuggestions(field),
    ...QUERY_CONFIG.STANDARD,
  });
}
