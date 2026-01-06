import { isAIEnabled, getAvailableProviders } from '@/lib/ai/provider-registry';

/**
 * API Route for AI Status Check
 * Returns whether AI functionality is enabled and available providers
 */

/**
 * GET /api/ai-status
 * Check if AI is enabled (at least one provider is configured)
 */
export async function GET() {
  const enabled = isAIEnabled();
  const providers = enabled ? getAvailableProviders().map((p) => p.id) : [];

  return Response.json({
    enabled,
    providers,
  });
}
