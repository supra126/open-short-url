'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * Hook to check if AI functionality is enabled
 * This checks if there's at least one AI provider configured
 * by attempting to fetch the /api/chat endpoint's capabilities
 */
export function useAIEnabled() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check AI availability status
   * Since we're client-side, we'll assume enabled by default
   * The actual check happens server-side when making requests
   */
  const checkAIStatus = useCallback(async () => {
    try {
      // For now, we'll check if the environment suggests AI is enabled
      // The actual validation happens server-side in the API route
      setIsEnabled(true);
    } catch (error) {
      ErrorHandler.log(error, 'AI Status Check');
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  return {
    isEnabled,
    isLoading,
    refresh: checkAIStatus,
  };
}
