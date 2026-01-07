'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, StopCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

/**
 * Chat Input Component
 * Handles user input for chat messages with support for multiline text
 */
interface ChatInputProps {
  /** Callback when message should be sent */
  onSend: (content: string) => void;
  /** Whether AI is currently processing */
  isLoading: boolean;
  /** Optional callback to stop generation */
  onStop?: () => void;
  /** Placeholder text */
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  onStop,
  placeholder,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [rows, setRows] = useState(1);

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (textareaRef.current) {
      const lineHeight = 24; // approximate line height in pixels
      const minRows = 1;
      const maxRows = 5;

      const currentRows = Math.floor(textareaRef.current.scrollHeight / lineHeight);
      const newRows = Math.min(Math.max(minRows, currentRows), maxRows);
      setRows(newRows);
    }
  }, [value]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSend(value);
    setValue(''); // Clear input after sending
    setRows(1); // Reset to single row after submit
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2 items-end">
        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={rows}
          className="flex-1 resize-none min-h-10"
        />

        {/* Submit/Stop button */}
        {isLoading && onStop ? (
          <Button
            type="button"
            onClick={onStop}
            variant="destructive"
            size="icon"
            className="shrink-0"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isLoading || !value.trim()}
            size="icon"
            className="shrink-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hint text */}
      <div className="mt-2 text-xs text-muted-foreground">
        {t('ai.chat.sendHintPrefix')} <kbd className="px-1 py-0.5 bg-muted rounded">{t('ai.chat.enterKey')}</kbd> {t('ai.chat.sendHintSend')}
        <kbd className="px-1 py-0.5 bg-muted rounded">{t('ai.chat.shiftEnterKey')}</kbd> {t('ai.chat.sendHintNewLine')}
      </div>
    </form>
  );
}
