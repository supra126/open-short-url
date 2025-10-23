/**
 * React Query Provider
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized default configuration
            staleTime: 3 * 60 * 1000, // 3 minutes - how long until data is considered stale (increased from 1 minute to 3 minutes)
            gcTime: 10 * 60 * 1000, // 10 minutes - cache retention time (increased from 5 minutes to 10 minutes)
            refetchOnWindowFocus: false, // don't automatically refetch data when window regains focus
            refetchOnMount: false, // don't automatically refetch data when component remounts (if cache exists)
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
