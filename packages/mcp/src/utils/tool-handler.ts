/**
 * Shared tool handler utility to reduce boilerplate across MCP tools
 */

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

/**
 * Wraps an async function with standardized MCP tool response formatting and error handling.
 *
 * @param fn - The async function to execute
 * @param successMessage - Optional custom success message (for void operations like delete)
 */
export function handleTool(
  fn: (args: any) => Promise<unknown>,
  successMessage?: (args: any) => string
): (args: any) => Promise<ToolResult> {
  return async (args: any) => {
    try {
      const result = await fn(args);
      const text = successMessage
        ? successMessage(args)
        : JSON.stringify(result, null, 2);
      return { content: [{ type: 'text' as const, text }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  };
}
