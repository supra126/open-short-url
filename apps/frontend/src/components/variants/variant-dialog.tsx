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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateVariant, useUpdateVariant } from '@/hooks/use-variants';
import { Loader2, Plus } from 'lucide-react';
import type { VariantResponseDto } from '@/hooks/use-variants';

interface VariantDialogProps {
  urlId: string;
  variant?: VariantResponseDto;
  trigger?: React.ReactNode;
}

export function VariantDialog({ urlId, variant, trigger }: VariantDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(variant?.name || '');
  const [targetUrl, setTargetUrl] = useState(variant?.targetUrl || '');
  const [weight, setWeight] = useState(variant?.weight || 50);
  const [isActive, setIsActive] = useState(variant?.isActive ?? true);

  const { toast } = useToast();
  const createMutation = useCreateVariant();
  const updateMutation = useUpdateVariant();

  const isEdit = !!variant;
  const mutation = isEdit ? updateMutation : createMutation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          urlId,
          variantId: variant.id,
          data: { name, targetUrl, weight, isActive },
        });
      } else {
        await createMutation.mutateAsync({
          urlId,
          data: { name, targetUrl, weight, isActive },
        });
      }

      toast({
        title: isEdit ? t('variants.updated') : t('variants.created'),
        description: isEdit
          ? t('variants.updatedDesc')
          : t('variants.createdDesc'),
      });

      setOpen(false);

      // Reset form for create mode
      if (!isEdit) {
        setName('');
        setTargetUrl('');
        setWeight(50);
        setIsActive(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('variants.createErrorDesc');
      toast({
        title: t('variants.createError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('variants.create')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('variants.edit') : t('variants.create')}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? t('variants.updatedDesc')
                : t('variants.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('variants.nameRequired')}
              </Label>
              <Input
                id="name"
                placeholder={t('variants.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Target URL */}
            <div className="grid gap-2">
              <Label htmlFor="targetUrl">
                {t('variants.targetUrlRequired')}
              </Label>
              <Input
                id="targetUrl"
                type="url"
                placeholder={t('variants.targetUrlPlaceholder')}
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t('variants.description')}
              </p>
            </div>

            {/* Weight */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weight">{t('variants.weight')}</Label>
                <span className="text-sm font-medium">{weight}%</span>
              </div>
              <Slider
                id="weight"
                min={0}
                max={100}
                step={1}
                value={[weight]}
                onValueChange={(values) => setWeight(values[0])}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {t('variants.weightHint')}
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">{t('variants.isActive')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('variants.isActiveHint')}
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
            <Button type="submit" disabled={mutation.isPending}>
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
