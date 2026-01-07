import { isAIEnabled, getAvailableProviders } from '@/lib/ai/provider-registry';

/**
 * Response type for AI Status endpoint
 * This is a frontend API route, so the type is defined here
 */
export interface AIStatusResponse {
  enabled: boolean;
  providers: string[];
}

/**
 * API Route for AI Status Check
 * Returns whether AI functionality is enabled and available providers
 */

/**
 * GET /api/ai-status
 * Check if AI is enabled (at least one provider is configured)
 */
export async function GET(): Promise<Response> {
  const enabled = isAIEnabled();
  const providers = enabled ? getAvailableProviders().map((p) => p.id) : [];

  return Response.json({
    enabled,
    providers,
  });
}
