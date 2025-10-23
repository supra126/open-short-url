/**
 * Create URL Form Component
 */

'use client';

import { t } from '@/lib/i18n';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateUrl } from '@/hooks/use-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CreateUrlForm() {
  const router = useRouter();
  const createUrl = useCreateUrl();
  const [formData, setFormData] = useState({
    originalUrl: '',
    customSlug: '',
    title: '',
    password: '',
    expiresAt: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmTerm: '',
    utmContent: '',
  });
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data: any = {
        originalUrl: formData.originalUrl,
      };

      if (formData.customSlug) data.customSlug = formData.customSlug;
      if (formData.title) data.title = formData.title;
      if (formData.password) data.password = formData.password;
      if (formData.expiresAt) data.expiresAt = new Date(formData.expiresAt).toISOString();
      if (formData.utmSource) data.utmSource = formData.utmSource;
      if (formData.utmMedium) data.utmMedium = formData.utmMedium;
      if (formData.utmCampaign) data.utmCampaign = formData.utmCampaign;
      if (formData.utmTerm) data.utmTerm = formData.utmTerm;
      if (formData.utmContent) data.utmContent = formData.utmContent;

      const result = await createUrl.mutateAsync(data);

      // Display success message and navigate to details page
      alert(t('urls.createSuccess').replace('{slug}', result.slug));
      router.push(`/urls/${result.id}`);
    } catch (err: any) {
      setError(err.message || t('urls.createError'));
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('urls.createTitle')}</CardTitle>
        <CardDescription>
          {t('urls.createDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Input
            label={t('urls.originalUrl')}
            type="url"
            placeholder={t('urls.urlPlaceholder')}
            value={formData.originalUrl}
            onChange={handleChange('originalUrl')}
            required
          />

          <Input
            label={t('urls.customSlugOptional')}
            type="text"
            placeholder={t('urls.customSlugPlaceholder')}
            value={formData.customSlug}
            onChange={handleChange('customSlug')}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('urls.customSlugHint')}
          </p>

          <Input
            label={t('urls.titleOptional')}
            type="text"
            placeholder={t('urls.titlePlaceholder')}
            value={formData.title}
            onChange={handleChange('title')}
          />

          {/* Advanced Options */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? t('urls.hideAdvanced') : t('urls.showAdvanced')}{t('urls.advancedOptions')}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg border p-4">
              <Input
                label={t('urls.passwordProtection')}
                type="password"
                placeholder={t('urls.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange('password')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('urls.passwordHint')}
              </p>

              <Input
                label={t('urls.expiresAt')}
                type="datetime-local"
                value={formData.expiresAt}
                onChange={handleChange('expiresAt')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('urls.expiresAtHint')}
              </p>

              {/* UTM Parameters */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium mb-1">{t('urls.utmSection')}</h4>
                  <p className="text-xs text-muted-foreground">{t('urls.utmSectionDesc')}</p>
                </div>

                <Input
                  label={t('urls.utmSource')}
                  type="text"
                  placeholder={t('urls.utmSourcePlaceholder')}
                  value={formData.utmSource}
                  onChange={handleChange('utmSource')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('urls.utmSourceHint')}
                </p>

                <Input
                  label={t('urls.utmMedium')}
                  type="text"
                  placeholder={t('urls.utmMediumPlaceholder')}
                  value={formData.utmMedium}
                  onChange={handleChange('utmMedium')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('urls.utmMediumHint')}
                </p>

                <Input
                  label={t('urls.utmCampaign')}
                  type="text"
                  placeholder={t('urls.utmCampaignPlaceholder')}
                  value={formData.utmCampaign}
                  onChange={handleChange('utmCampaign')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('urls.utmCampaignHint')}
                </p>

                <Input
                  label={t('urls.utmTerm')}
                  type="text"
                  placeholder={t('urls.utmTermPlaceholder')}
                  value={formData.utmTerm}
                  onChange={handleChange('utmTerm')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('urls.utmTermHint')}
                </p>

                <Input
                  label={t('urls.utmContent')}
                  type="text"
                  placeholder={t('urls.utmContentPlaceholder')}
                  value={formData.utmContent}
                  onChange={handleChange('utmContent')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('urls.utmContentHint')}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              isLoading={createUrl.isPending}
              disabled={createUrl.isPending}
            >
              {t('urls.createNew')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
