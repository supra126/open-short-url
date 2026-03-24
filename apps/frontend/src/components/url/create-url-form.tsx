/**
 * Create URL Form Component
 */

'use client';

import { t } from '@/lib/i18n';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateUrl, type CreateUrlDto } from '@/hooks/use-url';
import { useUploadOgImage } from '@/hooks/use-og-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { OgMetaSection, type OgMetaValues } from './og-meta-section';
import { UtmSection } from './utm-section';
import { EMPTY_UTM_VALUES, type UtmValues } from '@/lib/utm-templates';

export function CreateUrlForm() {
  const router = useRouter();
  const createUrl = useCreateUrl();
  const uploadOgImage = useUploadOgImage();
  const { toast } = useToast();
  const [ogMeta, setOgMeta] = useState<OgMetaValues>({
    ogTitle: '',
    ogDescription: '',
    twitterCardType: 'summary_large_image',
  });
  const [stagedOgFile, setStagedOgFile] = useState<File | null>(null);
  const [utmValues, setUtmValues] = useState<UtmValues>({
    ...EMPTY_UTM_VALUES,
  });
  const [formData, setFormData] = useState({
    originalUrl: '',
    customSlug: '',
    title: '',
    password: '',
    expiresAt: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password.length < 4) {
      toast({
        title: t('common.error'),
        description: t('urls.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const data: CreateUrlDto = {
        originalUrl: formData.originalUrl,
        customSlug: formData.customSlug || undefined,
        title: formData.title || undefined,
        password: formData.password || undefined,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : undefined,
        utmSource: utmValues.utmSource || undefined,
        utmMedium: utmValues.utmMedium || undefined,
        utmCampaign: utmValues.utmCampaign || undefined,
        utmTerm: utmValues.utmTerm || undefined,
        utmContent: utmValues.utmContent || undefined,
        utmId: utmValues.utmId || undefined,
        utmSourcePlatform: utmValues.utmSourcePlatform || undefined,
        ogTitle: ogMeta.ogTitle || undefined,
        ogDescription: ogMeta.ogDescription || undefined,
        twitterCardType: ogMeta.twitterCardType || undefined,
      };

      const result = await createUrl.mutateAsync(data);

      // Step 2: Upload OG image if staged
      if (stagedOgFile) {
        try {
          await uploadOgImage.mutateAsync({
            urlId: result.id,
            file: stagedOgFile,
          });
        } catch {
          // Non-blocking: URL was created, image upload failed
          toast({
            title: t('common.error'),
            description:
              'OG image upload failed, you can upload it later from the edit page.',
            variant: 'destructive',
          });
        }
      }

      // Display success message and navigate to details page
      toast({
        title: t('common.success'),
        description: t('urls.createSuccess').replace('{slug}', result.slug),
      });
      router.push(`/urls/${result.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('urls.createError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('urls.createTitle')}</CardTitle>
        <CardDescription>{t('urls.createDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              {showAdvanced ? t('urls.hideAdvanced') : t('urls.showAdvanced')}
              {t('urls.advancedOptions')}
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
                minLength={4}
                maxLength={128}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.password &&
                formData.password.length > 0 &&
                formData.password.length < 4
                  ? t('urls.passwordTooShort')
                  : t('urls.passwordHint')}
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
              <UtmSection values={utmValues} onChange={setUtmValues} />

              {/* Social Preview (OG Meta) */}
              <OgMetaSection
                value={ogMeta}
                onChange={setOgMeta}
                onImageStaged={setStagedOgFile}
              />
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
