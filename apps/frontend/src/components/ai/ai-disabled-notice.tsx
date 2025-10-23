import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BotOff, ExternalLink, Settings } from 'lucide-react';
import Link from 'next/link';
import { t } from '@/lib/i18n';

/**
 * AI Disabled Notice Component
 * Displays when no AI providers are configured
 * Provides instructions for administrators to enable AI functionality
 */
export function AIDisabledNotice() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <BotOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">{t('ai.disabled.title')}</h2>
          <p className="text-muted-foreground">
            {t('ai.disabled.subtitle')}
          </p>
        </div>

        {/* Setup Instructions */}
        <Alert className="mb-6">
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <strong className="block mb-2">{t('ai.disabled.adminSteps')}</strong>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>{t('ai.disabled.step1')}</li>
                  <li>{t('ai.disabled.step2')}</li>
                  <li>{t('ai.disabled.step3')}</li>
                  <li>{t('ai.disabled.step4')}</li>
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Provider Options */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{t('ai.disabled.availableProviders')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2">Anthropic Claude</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {t('ai.disabled.anthropicDesc')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('ai.disabled.anthropicPrice')}
              </p>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-2">OpenAI GPT</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {t('ai.disabled.openaiDesc')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('ai.disabled.openaiPrice')}
              </p>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-2">Google Gemini</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {t('ai.disabled.googleDesc')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('ai.disabled.googlePrice')}
              </p>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-2">{t('ai.disabled.othersDesc')}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {t('ai.disabled.othersDetail')}
              </p>
              <p className="text-xs text-muted-foreground">
               &nbsp;
              </p>
            </Card>
          </div>
        </div>

        {/* Example Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{t('ai.disabled.exampleConfig')}</h3>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div className="mb-2 text-muted-foreground"># .env</div>
            <div>AI_PROVIDER=anthropic</div>
            <div>AI_MODEL=claude-3-5-sonnet-20241022</div>
            <div>ANTHROPIC_API_KEY=sk-ant-your-api-key-here</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/ai-settings">
              <Settings className="mr-2 h-4 w-4" />
              {t('ai.disabled.viewDetailedGuide')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://docs.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('ai.disabled.anthropicDocs')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://platform.openai.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('ai.disabled.openaiPlatform')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
