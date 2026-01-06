'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';

/**
 * Type guard for result with success/error properties
 */
interface ToolResultWithStatus {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
}

function isToolResultWithStatus(value: unknown): value is ToolResultWithStatus {
  return value !== null && typeof value === 'object';
}

/**
 * Tool Result Component
 * Displays the result of an AI tool execution
 */
interface ToolResultProps {
  /** Name of the tool that was executed */
  toolName: string;
  /** Arguments passed to the tool */
  args: Record<string, unknown>;
  /** Result from the tool execution */
  result?: unknown;
  /** Current state of the tool execution */
  state: 'call' | 'result' | 'error';
}

export function ToolResult({ toolName, args, result, state }: ToolResultProps) {
  /**
   * Format tool name for display
   */
  const formatToolName = (name: string): string => {
    // Convert camelCase to Title Case
    return name
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Render state indicator
   */
  const StateIndicator = () => {
    switch (state) {
      case 'call':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('ai.tool.executing')}
          </Badge>
        );
      case 'result':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            {t('ai.tool.completed')}
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t('ai.tool.error')}
          </Badge>
        );
    }
  };

  /**
   * Render result content
   */
  const renderResult = () => {
    if (state === 'call') {
      return (
        <div className="text-sm text-muted-foreground">
          {t('ai.tool.executingMessage')}
        </div>
      );
    }

    if (!result) return null;

    // Check if result has standard status properties
    if (isToolResultWithStatus(result)) {
      // Handle error result
      if (result.success === false || result.error) {
        return (
          <div className="text-sm text-destructive">
            {result.error || 'Unknown error'}
          </div>
        );
      }

      // Handle success result
      if (result.success === true) {
        return (
          <div className="space-y-2">
            {result.message && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {result.message}
              </div>
            )}
            {result.data !== undefined && result.data !== null && (
              <div className="text-sm">
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      }
    }

    // Handle raw result
    return (
      <div className="text-sm">
        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <Card className="p-3 mt-2 bg-muted/50">
      {/* Tool header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            🔧 {formatToolName(toolName)}
          </span>
          <StateIndicator />
        </div>
      </div>

      {/* Tool arguments */}
      {Object.keys(args).length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-muted-foreground mb-1">{t('ai.tool.parameters')}</div>
          <div className="text-xs space-y-1">
            {Object.entries(args).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool result */}
      {renderResult()}
    </Card>
  );
}
