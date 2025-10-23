'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateBundle, useUpdateBundle } from '@/hooks/use-bundles';
import { useUrls } from '@/hooks/use-url';
import { Loader2, Check } from 'lucide-react';
import type { BundleResponse } from '@/types/api';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle?: BundleResponse;
}

// 預設顏色選項
const PRESET_COLORS = [
  '#3B82F6', // 藍色
  '#10B981', // 綠色
  '#F59E0B', // 琥珀色
  '#EF4444', // 紅色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉紅色
  '#14B8A6', // 青色
  '#F97316', // 橙色
];

// 預設圖示選項
const PRESET_ICONS = [
  '📦', '🎯', '🚀', '💼', '📊', '🎨', '🔗', '⚡',
  '🌟', '💡', '🎁', '🏆', '📱', '💻', '🌐', '📈',
];

export function BundleDialog({ open, onOpenChange, bundle }: BundleDialogProps) {
  const [name, setName] = useState(bundle?.name || '');
  const [description, setDescription] = useState(bundle?.description || '');
  const [color, setColor] = useState(bundle?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(bundle?.icon || PRESET_ICONS[0]);
  const [selectedUrlIds, setSelectedUrlIds] = useState<string[]>([]);

  const { toast } = useToast();
  const createMutation = useCreateBundle();
  const updateMutation = useUpdateBundle();

  // 只在建立模式時獲取 URLs
  const { data: urlsData, isLoading: urlsLoading } = useUrls({
    page: 1,
    pageSize: 100,
    status: 'ACTIVE',
  });

  const isEdit = !!bundle;
  const mutation = isEdit ? updateMutation : createMutation;

  // 重置表單當 bundle prop 改變時
  useEffect(() => {
    if (bundle) {
      setName(bundle.name);
      setDescription(bundle.description || '');
      setColor(bundle.color);
      setIcon(bundle.icon);
    } else {
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
      setIcon(PRESET_ICONS[0]);
      setSelectedUrlIds([]);
    }
  }, [bundle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表單驗證
    if (name.length > 100) {
      toast({
        title: t('common.error'),
        description: t('bundles.form.nameTooLong'),
        variant: 'destructive',
      });
      return;
    }

    if (description && description.length > 500) {
      toast({
        title: t('common.error'),
        description: t('bundles.form.descriptionTooLong'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const data: any = {
        name,
        description: description || undefined,
        color,
        icon,
      };

      // 只在建立時包含 urlIds
      if (!isEdit && selectedUrlIds.length > 0) {
        data.urlIds = selectedUrlIds;
      }

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: bundle!.id,
          data,
        });
        toast({
          title: t('common.success'),
          description: t('bundles.updateSuccess'),
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: t('common.success'),
          description: t('bundles.createSuccess'),
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const toggleUrlSelection = (urlId: string) => {
    setSelectedUrlIds((prev) =>
      prev.includes(urlId)
        ? prev.filter((id) => id !== urlId)
        : [...prev, urlId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? t('bundles.edit') : t('bundles.create')}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t('bundles.editDescription')
                : t('bundles.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* 基本資訊 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('bundles.form.basicInfo')}</h3>

              {/* 名稱 */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {t('bundles.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={t('bundles.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              {/* 描述 */}
              <div className="grid gap-2">
                <Label htmlFor="description">{t('bundles.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('bundles.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500
                </p>
              </div>
            </div>

            {/* 客製化 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('bundles.form.customization')}</h3>

              {/* 顏色選擇 */}
              <div className="grid gap-2">
                <Label>{t('bundles.color')}</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      className="relative h-10 w-10 rounded-md border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: presetColor,
                        borderColor: color === presetColor ? '#000' : 'transparent',
                      }}
                      onClick={() => setColor(presetColor)}
                    >
                      {color === presetColor && (
                        <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 圖示選擇 */}
              <div className="grid gap-2">
                <Label>{t('bundles.icon')}</Label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_ICONS.map((presetIcon) => (
                    <button
                      key={presetIcon}
                      type="button"
                      className={`h-10 w-10 rounded-md border-2 text-2xl transition-all hover:scale-110 ${
                        icon === presetIcon
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted'
                      }`}
                      onClick={() => setIcon(presetIcon)}
                    >
                      {presetIcon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* URL 選擇 - 僅在建立模式顯示 */}
            {!isEdit && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('bundles.form.selectUrls')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('bundles.selectUrlsHint')}
                </p>

                {urlsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : urlsData && urlsData.data.length > 0 ? (
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-3">
                      {urlsData.data.map((url) => (
                        <div
                          key={url.id}
                          className="flex items-start space-x-3 rounded-lg p-2 hover:bg-muted"
                        >
                          <Checkbox
                            id={`url-${url.id}`}
                            checked={selectedUrlIds.includes(url.id)}
                            onCheckedChange={() => toggleUrlSelection(url.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`url-${url.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {url.title || url.slug}
                            </Label>
                            <p className="text-xs text-muted-foreground truncate">
                              {url.originalUrl}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {t('bundles.noUrlsAvailable')}
                  </p>
                )}

                {selectedUrlIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('bundles.selectedUrls', { count: selectedUrlIds.length })}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
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
