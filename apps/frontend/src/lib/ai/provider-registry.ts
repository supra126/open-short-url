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
    description: 'GPT-4, GPT-4 Turbo, GPT-3.5',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    enabled: true,
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Latest multimodal model with vision capabilities',
        maxTokens: 128000,
        supportsFunctions: true,
        costPer1MTokens: { input: 2.5, output: 10 },
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Fast and powerful for complex tasks',
        maxTokens: 128000,
        supportsFunctions: true,
        costPer1MTokens: { input: 10, output: 30 },
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and economical for simple tasks',
        maxTokens: 16000,
        supportsFunctions: true,
        costPer1MTokens: { input: 0.5, output: 1.5 },
      },
    ],
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    enabled: true,
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model with best reasoning',
        maxTokens: 200000,
        supportsFunctions: true,
        costPer1MTokens: { input: 3, output: 15 },
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most powerful model for complex tasks',
        maxTokens: 200000,
        supportsFunctions: true,
        costPer1MTokens: { input: 15, output: 75 },
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest and most economical model',
        maxTokens: 200000,
        supportsFunctions: true,
        costPer1MTokens: { input: 0.25, output: 1.25 },
      },
    ],
  },

  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, Gemini Flash',
    apiKeyEnvVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    enabled: true,
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Multimodal with huge context window',
        maxTokens: 1000000,
        supportsFunctions: true,
        costPer1MTokens: { input: 1.25, output: 5 },
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient responses',
        maxTokens: 1000000,
        supportsFunctions: true,
        costPer1MTokens: { input: 0.075, output: 0.3 },
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
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro (Vertex)',
        description: 'Enterprise deployment on GCP',
        maxTokens: 1000000,
        supportsFunctions: true,
      },
      {
        id: 'claude-3-5-sonnet@20241022',
        name: 'Claude 3.5 Sonnet (Vertex)',
        description: 'Claude via Vertex AI deployment',
        maxTokens: 200000,
        supportsFunctions: true,
      },
    ],
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Open source powerful models',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    enabled: true,
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Most capable model',
        maxTokens: 128000,
        supportsFunctions: true,
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        description: 'Economical option',
        maxTokens: 32000,
        supportsFunctions: true,
      },
    ],
  },

  cohere: {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command R+ for enterprise conversations',
    apiKeyEnvVar: 'COHERE_API_KEY',
    enabled: true,
    models: [
      {
        id: 'command-r-plus',
        name: 'Command R+',
        description: 'Enterprise-grade conversational AI',
        maxTokens: 128000,
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
