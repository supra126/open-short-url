'use client';

import { t } from '@/lib/i18n';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUrl, useUpdateUrl, type UpdateUrlDto } from '@/hooks/use-url';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  OgMetaSection,
  type OgMetaValues,
} from '@/components/url/og-meta-section';
import { UtmSection } from '@/components/url/utm-section';
import { EMPTY_UTM_VALUES, type UtmValues } from '@/lib/utm-templates';

export default function EditUrlPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: urlData, isLoading } = useUrl(id);
  const updateUrl = useUpdateUrl();

  const [formData, setFormData] = useState<{
    originalUrl: string;
    title: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | '';
    password: string;
    expiresAt: string;
  }>({
    originalUrl: '',
    title: '',
    status: '',
    password: '',
    expiresAt: '',
  });
  const [utmValues, setUtmValues] = useState<UtmValues>({
    ...EMPTY_UTM_VALUES,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [removePassword, setRemovePassword] = useState(false);
  const [removeExpiry, setRemoveExpiry] = useState(false);
  const [ogMeta, setOgMeta] = useState<OgMetaValues>({
    ogTitle: '',
    ogDescription: '',
    twitterCardType: 'summary_large_image',
  });
  const [removeOgImage, setRemoveOgImage] = useState(false);
  const isPasswordTooShort =
    !removePassword &&
    !!formData.password &&
    formData.password.length > 0 &&
    formData.password.length < 4;

  // Fill form when data is loaded
  useEffect(() => {
    if (urlData) {
      setFormData({
        originalUrl: urlData.originalUrl,
        title: urlData.title || '',
        status: urlData.status,
        password: '',
        expiresAt: urlData.expiresAt
          ? new Date(urlData.expiresAt).toISOString().slice(0, 16)
          : '',
      });
      setUtmValues({
        utmSource: urlData.utmSource || '',
        utmMedium: urlData.utmMedium || '',
        utmCampaign: urlData.utmCampaign || '',
        utmTerm: urlData.utmTerm || '',
        utmContent: urlData.utmContent || '',
        utmId: urlData.utmId || '',
        utmSourcePlatform: urlData.utmSourcePlatform || '',
      });

      // Populate OG meta
      setOgMeta({
        ogTitle: urlData.ogTitle || '',
        ogDescription: urlData.ogDescription || '',
        twitterCardType: urlData.twitterCardType || 'summary_large_image',
      });

      // Expand advanced options by default if they exist
      if (
        urlData.hasPassword ||
        urlData.expiresAt ||
        urlData.ogTitle ||
        urlData.ogDescription ||
        urlData.ogImage ||
        urlData.utmSource ||
        urlData.utmMedium ||
        urlData.utmCampaign ||
        urlData.utmTerm ||
        urlData.utmContent ||
        urlData.utmId ||
        urlData.utmSourcePlatform
      ) {
        setShowAdvanced(true);
      }
    }
  }, [urlData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!removePassword && formData.password && formData.password.length < 4) {
      toast({
        title: t('common.error'),
        description: t('urls.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Build the update payload with proper typing
      // Note: password and expiresAt can be null to remove existing values
      const data = {
        originalUrl: formData.originalUrl,
        title: formData.title || undefined,
        status: formData.status || undefined,
        // Handle password
        password: removePassword ? null : formData.password || undefined,
        // Handle expiration time
        expiresAt: removeExpiry
          ? null
          : formData.expiresAt
            ? new Date(formData.expiresAt).toISOString()
            : undefined,
        // Handle UTM parameters (send null to clear existing values)
        utmSource:
          utmValues.utmSource || (urlData?.utmSource ? null : undefined),
        utmMedium:
          utmValues.utmMedium || (urlData?.utmMedium ? null : undefined),
        utmCampaign:
          utmValues.utmCampaign || (urlData?.utmCampaign ? null : undefined),
        utmTerm: utmValues.utmTerm || (urlData?.utmTerm ? null : undefined),
        utmContent:
          utmValues.utmContent || (urlData?.utmContent ? null : undefined),
        utmId: utmValues.utmId || (urlData?.utmId ? null : undefined),
        utmSourcePlatform:
          utmValues.utmSourcePlatform ||
          (urlData?.utmSourcePlatform ? null : undefined),
        // Handle OG meta
        ogTitle: ogMeta.ogTitle || undefined,
        ogDescription: ogMeta.ogDescription || undefined,
        twitterCardType: ogMeta.twitterCardType || undefined,
        ogImage: removeOgImage ? null : undefined,
      } as UpdateUrlDto;

      await updateUrl.mutateAsync({ id, data });

      toast({
        title: t('urls.updateSuccess'),
        description: t('urls.updateSuccess'),
      });

      router.push(`/urls/${id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('urls.updateError');
      toast({
        title: t('urls.updateError'),
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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">
            {t('urls.editTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('urls.editDesc')}</p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex h-75 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !urlData ? (
        /* Error state */
        <div className="flex h-75 flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">{t('urls.notFound')}</p>
          <Button onClick={() => router.push('/urls')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('urls.backToList')}
          </Button>
        </div>
      ) : (
        /* Content */
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('urls.settings')}</CardTitle>
            <CardDescription>
              {t('urls.slugNotEditable').replace('{slug}', urlData.slug)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalUrl">
                  {t('urls.originalUrlRequired')}
                </Label>
                <Input
                  id="originalUrl"
                  type="url"
                  placeholder={t('urls.urlPlaceholder')}
                  value={formData.originalUrl}
                  onChange={handleChange('originalUrl')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">{t('urls.titleOptional')}</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder={t('urls.titlePlaceholder')}
                  value={formData.title}
                  onChange={handleChange('title')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('urls.statusLabel')}</Label>
                {formData.status ? (
                  <Select
                    key={formData.status}
                    value={formData.status}
                    onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'EXPIRED') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        {t('urls.statusActive')}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t('urls.statusInactive')}
                      </SelectItem>
                      <SelectItem value="EXPIRED">
                        {t('urls.statusExpired')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('urls.inactiveHint')}
                </p>
              </div>

              {/* Advanced Options */}
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced
                    ? t('urls.hideAdvanced')
                    : t('urls.showAdvanced')}
                  {t('urls.advancedOptions')}
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">
                        {t('urls.passwordProtection')}
                      </Label>
                      {urlData.hasPassword && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovePassword(!removePassword)}
                        >
                          {removePassword
                            ? t('urls.keepPassword')
                            : t('urls.removePassword')}
                        </Button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder={
                        urlData.hasPassword
                          ? t('urls.passwordPlaceholderEdit')
                          : t('urls.passwordPlaceholder')
                      }
                      value={formData.password}
                      onChange={handleChange('password')}
                      disabled={removePassword}
                      minLength={4}
                      maxLength={128}
                    />
                    <p
                      className={`text-xs ${isPasswordTooShort ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      {removePassword
                        ? t('urls.passwordWillBeRemoved')
                        : isPasswordTooShort
                          ? t('urls.passwordTooShort')
                          : urlData.hasPassword
                            ? t('urls.passwordCurrentlySet')
                            : t('urls.passwordHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expiresAt">{t('urls.expiresAt')}</Label>
                      {urlData.expiresAt && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveExpiry(!removeExpiry)}
                        >
                          {removeExpiry
                            ? t('urls.keepExpiry')
                            : t('urls.removeExpiry')}
                        </Button>
                      )}
                    </div>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={handleChange('expiresAt')}
                      disabled={removeExpiry}
                    />
                    <p className="text-xs text-muted-foreground">
                      {removeExpiry
                        ? t('urls.expiryWillBeRemoved')
                        : t('urls.expiresAtHint')}
                    </p>
                  </div>

                  {/* UTM Parameters */}
                  <UtmSection values={utmValues} onChange={setUtmValues} />

                  {/* Social Preview (OG Meta) */}
                  <OgMetaSection
                    value={ogMeta}
                    onChange={setOgMeta}
                    urlId={id}
                    currentOgImageUrl={urlData.ogImageUrl}
                    onOgImageCleared={() => setRemoveOgImage(true)}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={updateUrl.isPending}>
                  {updateUrl.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('profile.saveChanges')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/urls/${id}`)}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
