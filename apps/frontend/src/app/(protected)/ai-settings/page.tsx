import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import {
  PROVIDER_CONFIGS,
  isAIEnabled,
  getAvailableProviders,
} from '@/lib/ai/provider-registry';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

/**
 * AI Settings Page
 * Displays AI provider configuration status and setup instructions
 * Server component - checks provider availability on the server
 */
export default function AISettingsPage() {
  const aiEnabled = isAIEnabled();
  const availableProviders = aiEnabled ? getAvailableProviders() : [];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          {t('ai.settings.title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('ai.settings.subtitle')}
        </p>
      </div>

      {/* Overall Status */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">{t('ai.settings.statusTitle')}</h2>
            <p className="text-muted-foreground">
              {aiEnabled
                ? t('ai.settings.providersConfigured', { count: availableProviders.length })
                : t('ai.settings.noProviders')}
            </p>
          </div>
          <Badge
            variant={aiEnabled ? 'default' : 'secondary'}
            className={`text-lg px-4 py-2 ${aiEnabled ? 'bg-green-600' : ''}`}
          >
            {aiEnabled ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                {t('common.enabled')}
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                {t('common.disabled')}
              </>
            )}
          </Badge>
        </div>
      </Card>

      {/* Provider Status */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('ai.settings.providerStatusTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(PROVIDER_CONFIGS).map((provider) => {
            const isAvailable = availableProviders.some(
              (p) => p.id === provider.id
            );
            return (
              <Card key={provider.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.description}
                    </p>
                  </div>
                  <Badge
                    variant={isAvailable ? 'default' : 'secondary'}
                    className={isAvailable ? 'bg-green-600' : ''}
                  >
                    {isAvailable ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t('ai.settings.envVariable')}</span>
                    <code className="bg-muted px-1 py-0.5 rounded ml-1">
                      {provider.apiKeyEnvVar}
                    </code>
                  </div>

                  {isAvailable && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t('ai.settings.availableModels')}</span>
                      <div className="mt-1 space-y-1">
                        {provider.models.map((model) => (
                          <div key={model.id} className="text-xs">
                            • {model.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('ai.settings.setupGuide')}</h2>

        {/* Quick Start */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">{t('ai.settings.quickStart')}</h3>
          <Alert>
            <AlertDescription>
              <ol className="list-decimal ml-4 space-y-3">
                <li>
                  <strong>{t('ai.settings.step1Title')}</strong>
                  <p className="text-sm mt-1">
                    {t('ai.settings.step1Desc')}
                  </p>
                </li>
                <li>
                  <strong>{t('ai.settings.step2Title')}</strong>
                  <p className="text-sm mt-1">
                    {t('ai.settings.step2Desc')}
                  </p>
                </li>
                <li>
                  <strong>{t('ai.settings.step3Title')}</strong>
                  <p className="text-sm mt-1">
                    {t('ai.settings.step3Desc')}
                  </p>
                </li>
                <li>
                  <strong>{t('ai.settings.step4Title')}</strong>
                  <p className="text-sm mt-1">
                    {t('ai.settings.step4Desc')}
                  </p>
                </li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>

        {/* Example Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">{t('ai.settings.exampleConfig')}</h3>
          <div className="space-y-4">
            {/* Anthropic */}
            <div>
              <h4 className="font-medium mb-2">
                {t('ai.settings.useAnthropic')}
              </h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <div className="text-muted-foreground mb-2"># .env</div>
                <div>AI_PROVIDER=anthropic</div>
                <div>AI_MODEL=claude-3-5-sonnet-20241022</div>
                <div>ANTHROPIC_API_KEY=sk-ant-your-api-key-here</div>
              </div>
            </div>

            {/* OpenAI */}
            <div>
              <h4 className="font-medium mb-2">{t('ai.settings.useOpenAI')}</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <div className="text-muted-foreground mb-2"># .env</div>
                <div>AI_PROVIDER=openai</div>
                <div>AI_MODEL=gpt-4o</div>
                <div>OPENAI_API_KEY=sk-your-api-key-here</div>
              </div>
            </div>

            {/* Google */}
            <div>
              <h4 className="font-medium mb-2">{t('ai.settings.useGoogle')}</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <div className="text-muted-foreground mb-2"># .env</div>
                <div>AI_PROVIDER=google</div>
                <div>AI_MODEL=gemini-1.5-pro</div>
                <div>GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">{t('ai.settings.costEstimate')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2">Claude 3.5 Sonnet</h4>
              <div className="text-sm space-y-1">
                <div>{t('ai.settings.inputCost', { cost: '$3' })}</div>
                <div>{t('ai.settings.outputCost', { cost: '$15' })}</div>
                <div className="text-muted-foreground mt-2">
                  {t('ai.settings.monthlyCost', { cost: '$5-10' })}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-2">GPT-4o</h4>
              <div className="text-sm space-y-1">
                <div>{t('ai.settings.inputCost', { cost: '$2.5' })}</div>
                <div>{t('ai.settings.outputCost', { cost: '$10' })}</div>
                <div className="text-muted-foreground mt-2">
                  {t('ai.settings.monthlyCost', { cost: '$4-8' })}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-2">Gemini 1.5 Pro</h4>
              <div className="text-sm space-y-1">
                <div>{t('ai.settings.inputCost', { cost: '$1.25' })}</div>
                <div>{t('ai.settings.outputCost', { cost: '$5' })}</div>
                <div className="text-muted-foreground mt-2">
                  {t('ai.settings.monthlyCost', { cost: '$2-5' })}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* External Links */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              Anthropic Console
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://platform.openai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              OpenAI Platform
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              Google AI Studio
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t('ai.settings.faqTitle')}</h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">{t('ai.settings.faq1Q')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('ai.settings.faq1A')}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">{t('ai.settings.faq2Q')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('ai.settings.faq2A')}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">{t('ai.settings.faq3Q')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('ai.settings.faq3A')}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">{t('ai.settings.faq4Q')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('ai.settings.faq4A')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
