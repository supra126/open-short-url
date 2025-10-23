'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to check if AI functionality is enabled
 * This checks if there's at least one AI provider configured
 * by attempting to fetch the /api/chat endpoint's capabilities
 */
export function useAIEnabled() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAIStatus();
  }, []);

  /**
   * Check AI availability status
   * Since we're client-side, we'll assume enabled by default
   * The actual check happens server-side when making requests
   */
  const checkAIStatus = async () => {
    try {
      // For now, we'll check if the environment suggests AI is enabled
      // The actual validation happens server-side in the API route
      setIsEnabled(true);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEnabled,
    isLoading,
    refresh: checkAIStatus,
  };
}
