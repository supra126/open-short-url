'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { CodeBlock, InlineCode } from './code-block';
import 'highlight.js/styles/github-dark.css';

/**
 * Markdown Renderer Component
 * Renders markdown content with code highlighting and custom components
 */
interface MarkdownRendererProps {
  /** Markdown content to render */
  children: string;
  /** Additional CSS classes */
  className?: string;
}

export function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Code blocks
          code({ className: codeClassName, children: codeChildren }: { className?: string; children?: React.ReactNode }) {
            const languageMatch = /language-(\w+)/.test(codeClassName ?? '')
              ? (codeClassName ?? '').match(/language-(\w+)/)
              : null;
            const language = languageMatch ? languageMatch[1] : '';
            const isInline = !languageMatch;

            if (!isInline && languageMatch) {
              return (
                <CodeBlock language={language} className="bg-muted">
                  {String(codeChildren).replace(/\n$/, '')}
                </CodeBlock>
              );
            }

            return <InlineCode>{codeChildren}</InlineCode>;
          },

          // Tables
          table({ children: tableChildren }) {
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">{tableChildren}</table>
              </div>
            );
          },

          // Links
          a({ href, children: linkChildren }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {linkChildren}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
