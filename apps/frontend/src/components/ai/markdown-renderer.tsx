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
          code({ className, children }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match;

            if (!isInline && match) {
              return (
                <CodeBlock language={language} className="bg-muted">
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              );
            }

            return <InlineCode>{children}</InlineCode>;
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">{children}</table>
              </div>
            );
          },

          // Links - open external links in new tab
          a({ href, children }) {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary hover:underline"
              >
                {children}
              </a>
            );
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                {children}
              </blockquote>
            );
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>;
          },

          // Headings
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-base font-semibold mt-3 mb-1">{children}</h4>;
          },

          // Paragraphs
          p({ children }) {
            return <p className="my-2 leading-relaxed">{children}</p>;
          },

          // Horizontal rule
          hr() {
            return <hr className="my-4 border-border" />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
