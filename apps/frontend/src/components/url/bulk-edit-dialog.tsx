/**
 * Bulk Edit URL Dialog
 */

'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useBulkUpdateUrls } from '@/hooks/use-bulk-urls';
import { useBundles } from '@/hooks/use-bundles';
import { Loader2 } from 'lucide-react';
import type { BulkUpdateOperation } from '@/lib/api/schemas';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

type OperationType = 'status' | 'bundle' | 'expiration' | 'utm';

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkEditDialogProps) {
  const [activeTab, setActiveTab] = useState<OperationType>('status');
  const { toast } = useToast();
  const bulkUpdate = useBulkUpdateUrls();

  // Form states
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [bundleId, setBundleId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [clearExpiration, setClearExpiration] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Fetch bundles for bundle selection
  const { data: bundlesData } = useBundles({ status: 'ACTIVE' });

  const handleSubmit = async () => {
    let operation: BulkUpdateOperation;

    switch (activeTab) {
      case 'status':
        operation = { type: 'status', status };
        break;
      case 'bundle':
        if (!bundleId) {
          toast({
            title: t('common.error'),
            description: t('urls.bulk.selectBundle'),
            variant: 'destructive',
          });
          return;
        }
        operation = { type: 'bundle', bundleId };
        break;
      case 'expiration':
        operation = {
          type: 'expiration',
          expiresAt: clearExpiration ? null : expiresAt || undefined,
        };
        break;
      case 'utm':
        operation = {
          type: 'utm',
          utmSource: utmSource || undefined,
          utmMedium: utmMedium || undefined,
          utmCampaign: utmCampaign || undefined,
          utmTerm: utmTerm || undefined,
          utmContent: utmContent || undefined,
        };
        break;
      default:
        return;
    }

    try {
      const result = await bulkUpdate.mutateAsync({
        urlIds: selectedIds,
        operation,
      });

      toast({
        title: t('common.success'),
        description: t('urls.bulk.updateSuccess', { count: result.updatedCount }),
      });

      onSuccess();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('urls.bulk.updateError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    // Reset form states
    setStatus('ACTIVE');
    setBundleId('');
    setExpiresAt('');
    setClearExpiration(false);
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
    setActiveTab('status');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('urls.bulk.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('urls.bulk.editDescription', { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as OperationType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">{t('urls.bulk.tabStatus')}</TabsTrigger>
            <TabsTrigger value="bundle">{t('urls.bulk.tabBundle')}</TabsTrigger>
            <TabsTrigger value="expiration">{t('urls.bulk.tabExpiration')}</TabsTrigger>
            <TabsTrigger value="utm">{t('urls.bulk.tabUtm')}</TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('urls.status')}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'ACTIVE' | 'INACTIVE')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('urls.statusActive')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('urls.statusInactive')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('urls.bulk.statusHelp')}
              </p>
            </div>
          </TabsContent>

          {/* Bundle Tab */}
          <TabsContent value="bundle" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('urls.bulk.selectBundleLabel')}</Label>
              <Select value={bundleId} onValueChange={setBundleId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('urls.bulk.selectBundlePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {bundlesData?.data.map((bundle) => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('urls.bulk.bundleHelp')}
              </p>
            </div>
          </TabsContent>

          {/* Expiration Tab */}
          <TabsContent value="expiration" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('urls.expiresAt')}</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => {
                  setExpiresAt(e.target.value);
                  setClearExpiration(false);
                }}
                disabled={clearExpiration}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="clearExpiration"
                checked={clearExpiration}
                onChange={(e) => {
                  setClearExpiration(e.target.checked);
                  if (e.target.checked) setExpiresAt('');
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="clearExpiration" className="text-sm font-normal">
                {t('urls.bulk.clearExpiration')}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('urls.bulk.expirationHelp')}
            </p>
          </TabsContent>

          {/* UTM Tab */}
          <TabsContent value="utm" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('urls.utmSource')}</Label>
                <Input
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="e.g., newsletter"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('urls.utmMedium')}</Label>
                <Input
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="e.g., email"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('urls.utmCampaign')}</Label>
                <Input
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="e.g., summer2024"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('urls.utmTerm')}</Label>
                <Input
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  placeholder="e.g., keyword"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>{t('urls.utmContent')}</Label>
                <Input
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="e.g., banner"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('urls.bulk.utmHelp')}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('urls.bulk.applyChanges', { count: selectedIds.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
