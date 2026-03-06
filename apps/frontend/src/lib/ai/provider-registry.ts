import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { vertex } from '@ai-sdk/google-vertex';
import { mistral } from '@ai-sdk/mistral';
import { cohere } from '@ai-sdk/cohere';
import type { AIProvider, ProviderConfig } from '@/types/ai';

/**
 * Registry of all available AI providers with their configurations
 * Each provider includes metadata, model information, and pricing details
 */
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-5.2, GPT-4o',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    enabled: true,
    models: [
      {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        description: 'Most capable model for reasoning, coding, and analysis',
        maxTokens: 128000,
        supportsFunctions: true,
        costPer1MTokens: { input: 5, output: 15 },
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Fast multimodal model, great balance of cost and performance',
        maxTokens: 128000,
        supportsFunctions: true,
        costPer1MTokens: { input: 2.5, output: 10 },
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Most economical option for simple tasks',
        maxTokens: 128000,
        supportsFunctions: true,
        costPer1MTokens: { input: 0.15, output: 0.6 },
      },
    ],
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Sonnet 4.6, Claude Haiku 4.5',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    enabled: true,
    models: [
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        description: 'Best balance of intelligence and speed',
        maxTokens: 200000,
        supportsFunctions: true,
        costPer1MTokens: { input: 3, output: 15 },
      },
      {
        id: 'claude-opus-4-6',
        name: 'Claude Opus 4.6',
        description: 'Most capable model for complex reasoning',
        maxTokens: 200000,
        supportsFunctions: true,
        costPer1MTokens: { input: 5, output: 25 },
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        description: 'Fastest and most economical model',
        maxTokens: 200000,
        supportsFunctions: true,
        costPer1MTokens: { input: 0.8, output: 4 },
      },
    ],
  },

  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 3.1 Pro, Gemini 3.1 Flash',
    apiKeyEnvVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    enabled: true,
    models: [
      {
        id: 'gemini-3.1-pro',
        name: 'Gemini 3.1 Pro',
        description: 'Most capable model with advanced reasoning',
        maxTokens: 1000000,
        supportsFunctions: true,
        costPer1MTokens: { input: 2, output: 12 },
      },
      {
        id: 'gemini-3.1-flash',
        name: 'Gemini 3.1 Flash',
        description: 'Fast and efficient for everyday tasks',
        maxTokens: 1000000,
        supportsFunctions: true,
        costPer1MTokens: { input: 0.1, output: 0.4 },
      },
    ],
  },

  vertex: {
    id: 'vertex',
    name: 'Google Vertex AI',
    description: 'Enterprise Google AI with Claude models',
    apiKeyEnvVar: 'GOOGLE_VERTEX_PROJECT',
    enabled: true,
    models: [
      {
        id: 'gemini-3.1-pro',
        name: 'Gemini 3.1 Pro (Vertex)',
        description: 'Enterprise deployment on GCP',
        maxTokens: 1000000,
        supportsFunctions: true,
      },
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6 (Vertex)',
        description: 'Claude via Vertex AI deployment',
        maxTokens: 200000,
        supportsFunctions: true,
      },
    ],
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large 3, Mistral Small',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    enabled: true,
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large 3',
        description: 'Most capable open-weight MoE model (675B)',
        maxTokens: 128000,
        supportsFunctions: true,
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small 3',
        description: 'Fast and economical',
        maxTokens: 128000,
        supportsFunctions: true,
      },
    ],
  },

  cohere: {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command A for enterprise conversations',
    apiKeyEnvVar: 'COHERE_API_KEY',
    enabled: true,
    models: [
      {
        id: 'command-a',
        name: 'Command A',
        description: 'Most capable enterprise model with agentic AI',
        maxTokens: 256000,
        supportsFunctions: true,
      },
    ],
  },
};

/**
 * Get the provider instance for API calls
 * @param provider - The provider ID
 * @returns The provider SDK instance
 */
export function getProviderInstance(provider: AIProvider) {
  switch (provider) {
    case 'openai':
      return openai;
    case 'anthropic':
      return anthropic;
    case 'google':
      return google;
    case 'vertex':
      return vertex;
    case 'mistral':
      return mistral;
    case 'cohere':
      return cohere;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Check if a provider is available (has API key configured)
 * @param provider - The provider ID to check
 * @returns Whether the provider is available
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  const config = PROVIDER_CONFIGS[provider];
  const apiKey = process.env[config.apiKeyEnvVar];
  return !!apiKey && config.enabled;
}

/**
 * Get all available (configured) providers
 * @returns Array of available provider configurations
 */
export function getAvailableProviders(): ProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS).filter((config) =>
    isProviderAvailable(config.id)
  );
}

/**
 * Check if AI functionality is enabled
 * @returns true if at least one provider is configured
 */
export function isAIEnabled(): boolean {
  return getAvailableProviders().length > 0;
}

/**
 * Get default AI provider and model configuration
 * Uses environment variables or falls back to first available provider
 * @returns Default provider and model IDs
 * @throws Error if no providers are configured
 */
export function getDefaultConfig() {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new Error(
      'No AI providers configured. Please set API keys in environment variables.'
    );
  }

  // Priority: environment variable or first available provider
  const defaultProvider =
    (process.env.AI_PROVIDER as AIProvider) || availableProviders[0].id;
  const defaultModel =
    process.env.AI_MODEL ||
    PROVIDER_CONFIGS[defaultProvider].models[0].id;

  return {
    provider: defaultProvider,
    model: defaultModel,
  };
}

/**
 * Get a specific provider configuration
 * @param provider - The provider ID
 * @returns Provider configuration or undefined
 */
export function getProviderConfig(
  provider: AIProvider
): ProviderConfig | undefined {
  return PROVIDER_CONFIGS[provider];
}

/**
 * Get a specific model configuration from a provider
 * @param provider - The provider ID
 * @param modelId - The model ID
 * @returns Model configuration or undefined
 */
export function getModelConfig(provider: AIProvider, modelId: string) {
  const providerConfig = PROVIDER_CONFIGS[provider];
  return providerConfig?.models.find((m) => m.id === modelId);
}
