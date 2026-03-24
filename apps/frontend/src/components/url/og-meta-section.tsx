/**
 * OG Meta Section Component
 * Social preview settings for URL create/edit forms
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { t } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUploadOgImage } from '@/hooks/use-og-image';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export interface OgMetaValues {
  ogTitle: string;
  ogDescription: string;
  twitterCardType: string;
}

interface OgMetaSectionProps {
  value: OgMetaValues;
  onChange: (value: OgMetaValues) => void;
  urlId?: string;
  currentOgImageUrl?: string;
  onImageStaged?: (file: File | null) => void;
  onOgImageCleared?: () => void;
}

export function OgMetaSection({
  value,
  onChange,
  urlId,
  currentOgImageUrl,
  onImageStaged,
  onOgImageCleared,
}: OgMetaSectionProps) {
  const { toast } = useToast();
  const uploadOgImage = useUploadOgImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const displayImageUrl = imageRemoved
    ? null
    : imagePreview || currentOgImageUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: 'File size exceeds 10MB limit',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('common.error'),
        description: 'Only jpg, png, webp, gif files are allowed',
        variant: 'destructive',
      });
      return;
    }

    // If we have a urlId (edit mode), upload immediately
    if (urlId) {
      try {
        await uploadOgImage.mutateAsync({ urlId, file });
        toast({
          title: t('common.success'),
          description: t('urls.ogImageUploadSuccess'),
        });
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const blobUrl = URL.createObjectURL(file);
        blobUrlRef.current = blobUrl;
        setImagePreview(blobUrl);
        setImageRemoved(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
      }
    } else {
      // Create mode: stage the file for upload after URL creation
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const blobUrl = URL.createObjectURL(file);
      blobUrlRef.current = blobUrl;
      setImagePreview(blobUrl);
      setImageRemoved(false);
      onImageStaged?.(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveConfirm = () => {
    setImagePreview(null);
    setImageRemoved(true);
    setRemoveDialogOpen(false);
    onImageStaged?.(null);
    onOgImageCleared?.();
  };

  const handleChange =
    (field: keyof OgMetaValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      onChange({ ...value, [field]: e.target.value });
    };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div>
        <h4 className="text-sm font-medium mb-1">{t('urls.ogSection')}</h4>
        <p className="text-xs text-muted-foreground">
          {t('urls.ogSectionDesc')}
        </p>
      </div>

      <Input
        label={t('urls.ogTitle')}
        type="text"
        placeholder={t('urls.ogTitlePlaceholder')}
        value={value.ogTitle}
        onChange={handleChange('ogTitle')}
        maxLength={100}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {t('urls.ogTitleHint')} ({value.ogTitle.length}/100)
      </p>

      <div>
        <label className="text-sm font-medium">{t('urls.ogDescription')}</label>
        <textarea
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1.5"
          placeholder={t('urls.ogDescriptionPlaceholder')}
          value={value.ogDescription}
          onChange={handleChange('ogDescription')}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('urls.ogDescriptionHint')} ({value.ogDescription.length}/200)
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">
          {t('urls.twitterCardType')}
        </label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1.5"
          value={value.twitterCardType}
          onChange={handleChange('twitterCardType')}
        >
          <option value="summary_large_image">
            {t('urls.twitterCardLarge')}
          </option>
          <option value="summary">{t('urls.twitterCardSummary')}</option>
        </select>
      </div>

      {/* Image Upload */}
      <div>
        <label className="text-sm font-medium">{t('urls.ogImage')}</label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          {t('urls.ogImageHint')}
        </p>

        {displayImageUrl ? (
          <div className="relative rounded-lg border overflow-hidden">
            <img
              src={displayImageUrl}
              alt="OG Preview"
              className="w-full max-h-50 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setRemoveDialogOpen(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadOgImage.isPending ? (
              <p className="text-sm text-muted-foreground">
                {t('urls.ogImageUploading')}
              </p>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  {t('urls.ogImageUpload')}
                </Button>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Preview Card */}
      {(value.ogTitle || value.ogDescription || displayImageUrl) && (
        <div>
          <label className="text-sm font-medium">
            {t('urls.socialPreview')}
          </label>
          <div className="mt-2 rounded-lg border overflow-hidden bg-muted/30">
            {displayImageUrl && (
              <img
                src={displayImageUrl}
                alt="Preview"
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-3">
              {value.ogTitle && (
                <p className="font-medium text-sm truncate">{value.ogTitle}</p>
              )}
              {value.ogDescription && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {value.ogDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Image Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('urls.ogImageRemove')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('urls.ogImageRemoveConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('urls.ogImageRemove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
