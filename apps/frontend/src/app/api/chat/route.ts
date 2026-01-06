import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from 'ai';
import { createLanguageModel, getAIConfigFromEnv } from '@/lib/ai/model-config';
import { isAIEnabled } from '@/lib/ai/provider-registry';
import { createAllMCPTools } from '@/lib/ai/mcp-adapter';
import { getSystemPrompt } from '@/lib/ai/prompts';
import { runWithContext } from '@/lib/ai/request-context';

interface ChatRequestBody {
  messages: UIMessage[];
}

/**
 * API Route for AI Chat
 * Handles chat requests with dynamic provider loading and tool execution
 *
 * Features:
 * - Dynamic AI provider selection based on environment variables
 * - Streaming responses for real-time user experience
 * - Multi-step tool execution
 * - Authentication verification
 * - Error handling
 */

/**
 * POST /api/chat
 * Handle chat requests from the AI assistant
 */
export async function POST(req: Request) {
  try {
    // Check if AI is enabled
    if (!isAIEnabled()) {
      return new Response(
        JSON.stringify({
          error: 'AI functionality is not enabled. Please configure an AI provider.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get and validate messages from request
    const { messages } = (await req.json()) as ChatRequestBody;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request: messages array is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract cookies from request to forward to backend API via MCP tools
    const cookies = req.headers.get('cookie') || '';

    // Get AI configuration from environment variables
    // This allows dynamic provider/model selection
    const aiConfig = getAIConfigFromEnv();

    // Create language model instance
    const model = createLanguageModel(aiConfig);

    // Convert UIMessage[] to ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    // Create all MCP tools dynamically (29 tools auto-generated from packages/mcp)
    const allTools = createAllMCPTools();

    // Execute streaming chat with tools within request context
    // This allows MCP tools to access user authentication via cookies
    const result = await runWithContext(
      { cookies },
      () => streamText({
        model,
        messages: modelMessages,
        system: getSystemPrompt(),
        tools: allTools,
        stopWhen: stepCountIs(5), // Allow up to 5 steps of tool execution
      })
    );

    // Return UI Message stream response compatible with useChat
    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage.includes('AI not configured')) {
      return new Response(
        JSON.stringify({
          error: 'AI provider not configured. Please set up environment variables.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: errorMessage || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
