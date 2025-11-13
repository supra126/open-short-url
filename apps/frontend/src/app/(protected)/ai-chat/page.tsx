import { ChatInterface } from '@/components/ai/chat-interface';
import { AIDisabledNotice } from '@/components/ai/ai-disabled-notice';
import { isAIEnabled } from '@/lib/ai/provider-registry';
import { t } from '@/lib/i18n';

/**
 * AI Chat Page
 * Main page for AI-powered chat functionality
 * Shows chat interface if AI is enabled, otherwise shows setup instructions
 */
export default function AIChatPage() {
  // Server-side check for AI availability
  const aiEnabled = isAIEnabled();

  // Show setup instructions if AI is not configured
  if (!aiEnabled) {
    return <AIDisabledNotice />;
  }

  // Show chat interface
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('ai.chat.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('ai.chat.description')}
        </p>
      </div>

      <ChatInterface />
    </div>
  );
}
