/**
 * AI Status Hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_CONFIG } from '@/lib/query-config';
import type { AIStatusResponse } from '@/app/api/ai-status/route';

// Re-export types for consumers
export type { AIStatusResponse };

export const aiKeys = {
  all: ['ai'] as const,
  status: () => [...aiKeys.all, 'status'] as const,
};

async function fetchAIStatus(): Promise<AIStatusResponse> {
  const response = await fetch('/api/ai-status');
  if (!response.ok) {
    throw new Error(`AI status check failed: ${response.status}`);
  }
  return response.json() as Promise<AIStatusResponse>;
}

/**
 * Hook to check if AI functionality is enabled
 * Calls /api/ai-status to check server-side configuration
 */
export function useAIEnabled() {
  return useQuery({
    queryKey: aiKeys.status(),
    queryFn: fetchAIStatus,
    ...QUERY_CONFIG.STATIC,
    retry: 1,
  });
}
