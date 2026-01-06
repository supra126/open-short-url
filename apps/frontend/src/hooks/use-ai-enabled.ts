'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorHandler } from '@/lib/error-handler';

interface AIStatusResponse {
  enabled: boolean;
  providers: string[];
}

/**
 * Hook to check if AI functionality is enabled
 * Calls /api/ai-status to check server-side configuration
 */
export function useAIEnabled() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check AI availability status via API
   */
  const checkAIStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai-status');

      if (!response.ok) {
        throw new Error(`AI status check failed: ${response.status}`);
      }

      const data = await response.json() as AIStatusResponse;
      setIsEnabled(data.enabled);
      setProviders(data.providers);
    } catch (error) {
      ErrorHandler.log(error, 'AI Status Check');
      setIsEnabled(false);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  return {
    isEnabled,
    providers,
    isLoading,
    refresh: checkAIStatus,
  };
}
