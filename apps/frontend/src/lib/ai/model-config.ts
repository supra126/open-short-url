import {
  getProviderInstance,
  PROVIDER_CONFIGS,
  getDefaultConfig,
} from './provider-registry';
import type { AIConfig, AIProvider } from '@/types/ai';

/**
 * Create a language model instance with the specified configuration
 * This function dynamically loads the appropriate provider and model
 * @param config - AI configuration including provider, model, and parameters
 * @returns Configured language model instance
 */
export function createLanguageModel(config: AIConfig) {
  const providerInstance = getProviderInstance(config.provider);

  // Create model with unified API
  return providerInstance(config.model);
}

/**
 * Get AI configuration from environment variables
 * Falls back to defaults if not specified
 * @returns AI configuration object
 */
export function getAIConfigFromEnv(): AIConfig {
  try {
    const defaults = getDefaultConfig();

    return {
      provider: (process.env.AI_PROVIDER as AIProvider) || defaults.provider,
      model: process.env.AI_MODEL || defaults.model,
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
      topP: parseFloat(process.env.AI_TOP_P || '1.0'),
    };
  } catch (error) {
    // If no providers configured, return a placeholder config
    // The calling code should check isAIEnabled() first
    throw new Error(
      'AI not configured. Please set up at least one AI provider in environment variables.'
    );
  }
}

/**
 * Validate if an AI configuration is valid
 * Checks if the provider exists and the model is available for that provider
 * @param config - AI configuration to validate
 * @returns true if configuration is valid
 */
export function validateAIConfig(config: AIConfig): boolean {
  const providerConfig = PROVIDER_CONFIGS[config.provider];
  if (!providerConfig) return false;

  const modelExists = providerConfig.models.some((m) => m.id === config.model);
  return modelExists;
}

/**
 * Get recommended AI configuration based on task complexity
 * @param complexity - Task complexity: 'simple', 'medium', or 'complex'
 * @returns Recommended AI configuration
 */
export function getRecommendedConfig(
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): AIConfig {
  const defaults = getDefaultConfig();

  // Select model based on complexity and available providers
  const configs: Record<string, Partial<AIConfig>> = {
    simple: {
      // Use faster/cheaper models for simple tasks
      temperature: 0.5,
      maxTokens: 2048,
    },
    medium: {
      // Balanced configuration
      temperature: 0.7,
      maxTokens: 4096,
    },
    complex: {
      // Use more powerful models for complex tasks
      temperature: 0.8,
      maxTokens: 8192,
    },
  };

  return {
    provider: defaults.provider,
    model: defaults.model,
    ...configs[complexity],
  };
}
