'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/ai';
import { MessageItem } from './message-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
import { t } from '@/lib/i18n';

/**
 * Message List Component
 * Displays a scrollable list of chat messages
 */
interface MessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Whether the AI is currently responding */
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * Render empty state
   */
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{t('ai.messages.welcome')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('ai.messages.welcomeDesc')}
          </p>
          <div className="text-left space-y-3 text-sm">
            {[
              { icon: '🔗', title: t('ai.messages.urlManagement'), desc: t('ai.messages.urlManagementDesc') },
              { icon: '📊', title: t('ai.messages.analytics'), desc: t('ai.messages.analyticsDesc') },
              { icon: '🧪', title: t('ai.messages.abTesting'), desc: t('ai.messages.abTestingDesc') },
              { icon: '📁', title: t('ai.messages.bundles'), desc: t('ai.messages.bundlesDesc') },
            ].map((item) => (
              <div key={item.icon} className="flex items-start gap-2">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 pb-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
