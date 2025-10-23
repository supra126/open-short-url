'use client';

import type { Message } from '@/types/ai';
import { getMessageText, getMessageToolCalls } from '@/types/ai';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { ToolResult } from './tool-result';
import { CopyButton } from './copy-button';

/**
 * Message Item Component
 * Displays a single message in the chat interface
 */
interface MessageItemProps {
  /** Message object from AI SDK */
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const content = getMessageText(message);
  const toolCalls = getMessageToolCalls(message);

  /**
   * Get avatar content based on role
   */
  const getAvatar = () => {
    if (isUser) {
      return (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    }

    return (
      <Avatar className="h-8 w-8 bg-secondary">
        <AvatarFallback>
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {getAvatar()}

      {/* Message content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Card
          className={`p-3 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {/* Message text */}
          {content && (
            <div className="relative group">
              {isUser ? (
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                <MarkdownRenderer>{content}</MarkdownRenderer>
              )}

              {/* Copy button */}
              {!isUser && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={content} />
                </div>
              )}
            </div>
          )}

          {/* Tool invocations */}
          {isAssistant && toolCalls && toolCalls.length > 0 && (
            <div className="mt-2 space-y-2">
              {toolCalls.map((toolCall: any, index: number) => (
                <ToolResult
                  key={`${message.id}-tool-${index}`}
                  toolName={toolCall.toolName}
                  args={toolCall.args}
                  result={toolCall.result}
                  state={toolCall.state || 'call'}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Timestamp - only show if metadata contains createdAt */}
        {(() => {
          if (
            message.metadata &&
            typeof message.metadata === 'object' &&
            'createdAt' in message.metadata &&
            typeof (message.metadata as { createdAt?: unknown }).createdAt === 'string'
          ) {
            return (
              <div className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                {new Date((message.metadata as { createdAt: string }).createdAt).toLocaleTimeString('zh-TW', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
