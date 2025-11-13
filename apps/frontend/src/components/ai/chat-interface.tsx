'use client';

import { useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { useChatHistory } from '@/hooks/use-chat-history';
import { ErrorHandler } from '@/lib/error-handler';
import { Trash2, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';

/**
 * Chat Interface Component
 * Main component for AI chat functionality
 * Integrates message display, input, and history management
 */
export function ChatInterface() {
  const {
    messages,
    status,
    sendMessage,
    stop,
    setMessages,
  } = useChat({
    // @ts-expect-error - api is valid in AI SDK v5 but TypeScript may not recognize it yet
    api: '/api/chat',
    onError: (error: Error) => {
      ErrorHandler.log(error, 'Chat Error');
    },
    onFinish: (message) => {
      // Message finished successfully - no need to log in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Message finished:', message);
      }
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const { saveHistory, getRecent, loadHistory, clearAll } =
    useChatHistory();

  /**
   * Save chat history whenever messages change
   */
  useEffect(() => {
    if (messages.length > 0) {
      // Use a unique ID for this session (could be improved)
      const sessionId = 'current-session';
      saveHistory(sessionId, messages);
    }
  }, [messages, saveHistory]);

  /**
   * Load a history into current chat
   */
  const handleLoadHistory = (historyId: string) => {
    const history = loadHistory(historyId);
    if (history) {
      setMessages(history.messages);
    }
  };

  /**
   * Clear current chat
   */
  const handleClearChat = () => {
    setMessages([]);
  };

  /**
   * Get recent chat histories for quick access
   */
  const recentHistories = getRecent(5);

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{t('ai.chat.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {messages.length > 0
              ? t('ai.chat.messagesCount', { count: messages.length })
              : t('ai.chat.startNewChat')}
          </p>
        </div>

        <div className="flex gap-2">
          {/* History dropdown */}
          {recentHistories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  {t('ai.chat.history')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {recentHistories.map((history) => (
                  <DropdownMenuItem
                    key={history.id}
                    onClick={() => handleLoadHistory(history.id)}
                    className="flex flex-col items-start py-2"
                  >
                    <div className="font-medium truncate w-full">
                      {history.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(history.updatedAt).toLocaleString('zh-TW')}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearAll}
                  className="text-destructive"
                >
                  {t('ai.chat.clearAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear chat button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('ai.chat.clearChat')}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput
        onSend={(content) => sendMessage({ parts: [{ type: 'text', text: content }] })}
        isLoading={isLoading}
        onStop={stop}
        placeholder={t('ai.chat.inputPlaceholder')}
      />
    </Card>
  );
}
