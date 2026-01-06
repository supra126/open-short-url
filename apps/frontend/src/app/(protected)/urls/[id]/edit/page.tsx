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
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
  }>({
    originalUrl: '',
    title: '',
    status: '',
    password: '',
    expiresAt: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmTerm: '',
    utmContent: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [removePassword, setRemovePassword] = useState(false);
  const [removeExpiry, setRemoveExpiry] = useState(false);

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
        utmSource: urlData.utmSource || '',
        utmMedium: urlData.utmMedium || '',
        utmCampaign: urlData.utmCampaign || '',
        utmTerm: urlData.utmTerm || '',
        utmContent: urlData.utmContent || '',
      });

      // Expand advanced options by default if they exist
      if (urlData.hasPassword || urlData.expiresAt) {
        setShowAdvanced(true);
      }
    }
  }, [urlData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Build the update payload with proper typing
      // Note: password and expiresAt can be null to remove existing values
      const data = {
        originalUrl: formData.originalUrl,
        title: formData.title || undefined,
        status: formData.status || undefined,
        // Handle password
        password: removePassword ? null : (formData.password || undefined),
        // Handle expiration time
        expiresAt: removeExpiry ? null : (formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined),
        // Handle UTM parameters
        utmSource: formData.utmSource || undefined,
        utmMedium: formData.utmMedium || undefined,
        utmCampaign: formData.utmCampaign || undefined,
        utmTerm: formData.utmTerm || undefined,
        utmContent: formData.utmContent || undefined,
      } as UpdateUrlDto;

      await updateUrl.mutateAsync({ id, data });

      toast({
        title: t('urls.updateSuccess'),
        description: t('urls.updateSuccess'),
      });

      router.push(`/urls/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('urls.updateError');
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (!urlData) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{t('urls.notFound')}</p>
        <Button onClick={() => router.push('/urls')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('urls.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('urls.editTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('urls.editDesc')}</p>
        </div>
      </div>

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
                {showAdvanced ? t('urls.hideAdvanced') : t('urls.showAdvanced')}
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
                  />
                  <p className="text-xs text-muted-foreground">
                    {removePassword
                      ? t('urls.passwordWillBeRemoved')
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
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      {t('urls.utmSection')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t('urls.utmSectionDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmSource">{t('urls.utmSource')}</Label>
                    <Input
                      id="utmSource"
                      type="text"
                      placeholder={t('urls.utmSourcePlaceholder')}
                      value={formData.utmSource}
                      onChange={handleChange('utmSource')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('urls.utmSourceHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmMedium">{t('urls.utmMedium')}</Label>
                    <Input
                      id="utmMedium"
                      type="text"
                      placeholder={t('urls.utmMediumPlaceholder')}
                      value={formData.utmMedium}
                      onChange={handleChange('utmMedium')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('urls.utmMediumHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmCampaign">{t('urls.utmCampaign')}</Label>
                    <Input
                      id="utmCampaign"
                      type="text"
                      placeholder={t('urls.utmCampaignPlaceholder')}
                      value={formData.utmCampaign}
                      onChange={handleChange('utmCampaign')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('urls.utmCampaignHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmTerm">{t('urls.utmTerm')}</Label>
                    <Input
                      id="utmTerm"
                      type="text"
                      placeholder={t('urls.utmTermPlaceholder')}
                      value={formData.utmTerm}
                      onChange={handleChange('utmTerm')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('urls.utmTermHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmContent">{t('urls.utmContent')}</Label>
                    <Input
                      id="utmContent"
                      type="text"
                      placeholder={t('urls.utmContentPlaceholder')}
                      value={formData.utmContent}
                      onChange={handleChange('utmContent')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('urls.utmContentHint')}
                    </p>
                  </div>
                </div>
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
    </div>
  );
}
