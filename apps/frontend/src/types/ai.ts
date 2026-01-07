import type { UIMessage } from 'ai';

export type Message = UIMessage;

/**
 * Helper function to extract text content from a message
 * In AI SDK v5, messages have a parts array structure
 */
export function getMessageText(message: Message): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Helper function to get tool invocations from a message
 */
export function getMessageToolCalls(message: Message) {
  return message.parts.filter((part) => part.type === 'tool-call');
}

/**
 * Supported AI providers
 */
export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'vertex'
  | 'mistral'
  | 'cohere';

/**
 * Configuration for a single AI provider
 */
export interface ProviderConfig {
  /** Unique identifier for the provider */
  id: AIProvider;
  /** Display name of the provider */
  name: string;
  /** Short description of the provider's offerings */
  description: string;
  /** Environment variable name for the API key */
  apiKeyEnvVar: string;
  /** Available models for this provider */
  models: ModelConfig[];
  /** Icon identifier (optional) */
  icon?: string;
  /** Whether this provider is enabled */
  enabled: boolean;
}

/**
 * Configuration for a specific AI model
 */
export interface ModelConfig {
  /** Unique identifier for the model */
  id: string;
  /** Display name of the model */
  name: string;
  /** Description of the model's capabilities */
  description: string;
  /** Maximum tokens supported by the model */
  maxTokens?: number;
  /** Whether the model supports function calling */
  supportsFunctions?: boolean;
  /** Cost per 1 million tokens (input/output) */
  costPer1MTokens?: {
    input: number;
    output: number;
  };
}

/**
 * AI configuration settings
 */
export interface AIConfig {
  /** Selected AI provider */
  provider: AIProvider;
  /** Selected model ID */
  model: string;
  /** Temperature setting (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top P sampling parameter */
  topP?: number;
}

/**
 * Chat history entry stored in localStorage
 */
export interface ChatHistory {
  /** Unique identifier for the chat */
  id: string;
  /** Title/summary of the chat */
  title: string;
  /** Array of messages in the chat */
  messages: Message[];
  /** ISO timestamp when chat was created */
  createdAt: string;
  /** ISO timestamp when chat was last updated */
  updatedAt: string;
}

/**
 * Tool invocation result
 */
export interface ToolInvocation {
  /** Name of the tool that was invoked */
  toolName: string;
  /** Arguments passed to the tool */
  args: Record<string, unknown>;
  /** Result returned by the tool */
  result?: unknown;
  /** Error if tool execution failed */
  error?: string;
  /** Current state of the invocation */
  state: 'call' | 'result' | 'error';
}

/**
 * Parameters for creating a short URL via AI tools
 * Maps to CreateUrlDto from backend, with AI-friendly field names
 * @see CreateUrlDto in @/lib/api/schemas for the backend DTO
 */
export type { CreateUrlDto as CreateShortUrlParams } from '@/lib/api/schemas';

/**
 * Parameters for creating a bundle via AI tools
 * @see CreateBundleDto in @/lib/api/schemas for the backend DTO
 */
export type { CreateBundleDto as CreateBundleParams } from '@/lib/api/schemas';

/**
 * Response from AI provider availability check
 */
export interface ProviderAvailability {
  /** Whether any providers are available */
  hasProviders: boolean;
  /** List of available provider IDs */
  availableProviders: AIProvider[];
  /** Default provider to use (if any) */
  defaultProvider?: AIProvider;
  /** Default model to use (if any) */
  defaultModel?: string;
}
