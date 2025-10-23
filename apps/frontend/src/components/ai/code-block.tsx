'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import copy from 'copy-to-clipboard';

/**
 * Code Block Component
 * Renders code with syntax highlighting and copy functionality
 */
interface CodeBlockProps {
  /** Code content to display */
  children: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Additional CSS classes */
  className?: string;
}

export function CodeBlock({ children, language, className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = () => {
    copy(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {/* Language label */}
      {language && (
        <div className="absolute top-2 left-3 text-xs text-muted-foreground font-mono">
          {language}
        </div>
      )}

      {/* Copy button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            已複製
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" />
            複製
          </>
        )}
      </Button>

      {/* Code content */}
      <pre className={`overflow-x-auto p-4 ${language ? 'pt-8' : ''} ${className}`}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

/**
 * Inline Code Component
 * For small inline code snippets
 */
interface InlineCodeProps {
  children: React.ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  );
}
