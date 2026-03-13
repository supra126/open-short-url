/**
 * Shared tool handler utility to reduce boilerplate across MCP tools
 */

import { sanitize, sanitizeJson } from './sanitizer.js';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

export interface HandleToolOptions {
  /** Skip sanitization for this tool's response (default: false) */
  skipSanitize?: boolean;
}

/**
 * Wraps an async function with standardized MCP tool response formatting and error handling.
 * Automatically sanitizes sensitive data (API keys, secrets, passwords) from responses.
 *
 * @param fn - The async function to execute
 * @param successMessage - Optional custom success message (for void operations like delete)
 * @param options - Optional configuration
 */
export function handleTool(
  fn: (args: any) => Promise<unknown>,
  successMessage?: ((args: any) => string) | null,
  options?: HandleToolOptions
): (args: any) => Promise<ToolResult> {
  return async (args: any) => {
    try {
      const result = await fn(args);
      let text: string;
      if (successMessage) {
        text = successMessage(args);
      } else if (typeof result === 'string') {
        // String results: sanitize JSON content, pass CSV/text through as-is
        const trimmed = result.trimStart();
        text = (trimmed.startsWith('{') || trimmed.startsWith('['))
          ? sanitizeJson(result)
          : result;
      } else {
        // Sanitize response data to prevent sensitive info leaking to LLM
        const safeResult = options?.skipSanitize ? result : sanitize(result);
        text = JSON.stringify(safeResult ?? null, null, 2);
      }
      return { content: [{ type: 'text' as const, text }] };
    } catch (error) {
      // Sanitize error messages to avoid leaking internal details
      const rawMessage = error instanceof Error ? error.message : String(error);
      // Strip potential sensitive data from error messages (URLs with tokens, etc.)
      const safeMessage = rawMessage.replace(
        /(?:Bearer\s+|key[=:]\s*|token[=:]\s*|secret[=:]\s*|password[=:]\s*|newPassword[=:]\s*|new_password[=:]\s*)[^\s,}]*/gi,
        '[REDACTED]'
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${safeMessage}`,
          },
        ],
        isError: true,
      };
    }
  };
}
