'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCreateWebhook, useUpdateWebhook } from '@/hooks/use-webhooks';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { WebhookResponse } from '@/types/api';

interface WebhookDialogProps {
  webhook?: WebhookResponse;
  trigger?: React.ReactNode;
}

const AVAILABLE_EVENTS = [
  { value: 'url.created', labelKey: 'webhooks.eventUrlCreated' },
  { value: 'url.clicked', labelKey: 'webhooks.eventUrlClicked' },
];

export function WebhookDialog({ webhook, trigger }: WebhookDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(webhook?.name || '');
  const [url, setUrl] = useState(webhook?.url || '');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(webhook?.events || ['url.created']);
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    webhook?.headers
      ? Object.entries(webhook.headers).map(([key, value]) => ({ key, value }))
      : []
  );

  const { toast } = useToast();
  const createMutation = useCreateWebhook();
  const updateMutation = useUpdateWebhook();

  const isEdit = !!webhook;
  const mutation = isEdit ? updateMutation : createMutation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const headersObj = headers.reduce(
        (acc, { key, value }) => {
          if (key && value) acc[key] = value;
          return acc;
        },
        {} as Record<string, string>
      );

      const data: any = {
        name,
        url,
        events,
        isActive,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      };

      // Only include secret if it's provided (for edit mode)
      if (!isEdit || secret) {
        data.secret = secret;
      }

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: webhook.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }

      toast({
        title: isEdit ? t('webhooks.updated') : t('webhooks.created'),
        description: isEdit
          ? t('webhooks.updatedDesc')
          : t('webhooks.createdDesc'),
      });

      setOpen(false);

      // Reset form for create mode
      if (!isEdit) {
        setName('');
        setUrl('');
        setSecret('');
        setEvents(['url.created']);
        setIsActive(true);
        setHeaders([]);
      }
    } catch (error: any) {
      toast({
        title: t('webhooks.createError'),
        description: error.message || t('webhooks.createErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('webhooks.create')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('webhooks.editWebhook') : t('webhooks.create')}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? t('webhooks.updatedDesc')
                : t('webhooks.noWebhooksDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('webhooks.nameRequired')}
              </Label>
              <Input
                id="name"
                placeholder={t('webhooks.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* URL */}
            <div className="grid gap-2">
              <Label htmlFor="url">
                {t('webhooks.urlRequired')}
              </Label>
              <Input
                id="url"
                type="url"
                placeholder={t('webhooks.urlPlaceholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t('webhooks.urlHint')}
              </p>
            </div>

            {/* Secret */}
            <div className="grid gap-2">
              <Label htmlFor="secret">
                {!isEdit ? t('webhooks.secretRequired') : t('webhooks.secret')}
              </Label>
              <Input
                id="secret"
                type="password"
                placeholder={isEdit ? t('webhooks.secretPlaceholderEdit') : t('webhooks.secretPlaceholder')}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required={!isEdit}
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">
                {t('webhooks.secretHint')}
              </p>
            </div>

            {/* Events */}
            <div className="grid gap-2">
              <Label>
                {t('webhooks.eventsRequired')}
              </Label>
              <div className="space-y-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.value}
                      checked={events.includes(event.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEvents([...events, event.value]);
                        } else {
                          setEvents(events.filter((e) => e !== event.value));
                        }
                      }}
                    />
                    <Label
                      htmlFor={event.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {t(event.labelKey as any)}
                    </Label>
                  </div>
                ))}
              </div>
              {events.length === 0 && (
                <p className="text-sm text-destructive">{t('webhooks.eventsMinError')}</p>
              )}
            </div>

            {/* Custom Headers */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>{t('webhooks.customHeaders')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t('webhooks.addHeader')}
                </Button>
              </div>
              {headers.length > 0 && (
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={t('webhooks.headerName')}
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      />
                      <Input
                        placeholder={t('webhooks.headerValue')}
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeader(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {t('webhooks.customHeadersDesc')}
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">{t('webhooks.isActive')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('webhooks.isActiveHint')}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || events.length === 0}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
