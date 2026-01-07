/**
 * Bulk Create URL Dialog with CSV Upload
 */

'use client';

import { useState, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useBulkCreateUrls } from '@/hooks/use-bulk-urls';
import { Loader2, Upload, FileText, CheckCircle2, XCircle, Download } from 'lucide-react';
import type { CreateUrlDto } from '@/hooks/use-url';
import type { BulkCreateResultDto } from '@/hooks/use-bulk-urls';

interface BulkCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// CSV Template columns
const CSV_COLUMNS = [
  'originalUrl',
  'customSlug',
  'title',
  'password',
  'expiresAt',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
];

/**
 * Validate URL format
 */
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize CSV value to prevent formula injection attacks
 * Uses OWASP recommended approach: prefix with single quote to prevent execution
 * while preserving the original data
 */
const sanitizeCSVValue = (value: string | undefined): string | undefined => {
  if (!value) return value;

  // Characters that can trigger formula execution in spreadsheet applications
  // Only include actual formula trigger chars per OWASP guidelines
  const dangerousChars = ['=', '+', '-', '@'];

  // If value starts with a dangerous character, prefix with single quote
  // This preserves the original data while preventing formula execution
  if (dangerousChars.includes(value.charAt(0))) {
    return `'${value}`;
  }

  return value;
};

export function BulkCreateDialog({ open, onOpenChange, onSuccess }: BulkCreateDialogProps) {
  const [parsedUrls, setParsedUrls] = useState<CreateUrlDto[]>([]);
  const [result, setResult] = useState<BulkCreateResultDto | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const bulkCreate = useBulkCreateUrls();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Limit file size to 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      setParseError(t('urls.bulk.fileTooLarge'));
      setParsedUrls([]);
      return;
    }

    setParseError(null);
    setResult(null);

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const urls = parseCSV(text);

        if (urls.length === 0) {
          setParseError(t('urls.bulk.noValidData'));
          setParsedUrls([]);
          return;
        }

        if (urls.length > 500) {
          setParseError(t('urls.bulk.tooManyUrls'));
          setParsedUrls([]);
          return;
        }

        setParsedUrls(urls);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : t('urls.bulk.parseError'));
        setParsedUrls([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (text: string): CreateUrlDto[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error(t('urls.bulk.csvNoData'));
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const urlIndex = header.findIndex((h) => h.toLowerCase() === 'originalurl');

    if (urlIndex === -1) {
      throw new Error(t('urls.bulk.missingOriginalUrl'));
    }

    // Parse data rows
    const urls: CreateUrlDto[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const originalUrl = values[urlIndex]?.trim();
      if (!originalUrl || !isValidUrl(originalUrl)) continue;

      const urlDto: CreateUrlDto = { originalUrl };

      // Map other columns with sanitization
      header.forEach((col, idx) => {
        const rawValue = values[idx]?.trim();
        if (!rawValue) return;

        // Sanitize value to prevent CSV injection
        const value = sanitizeCSVValue(rawValue);
        if (!value) return;

        const colLower = col.toLowerCase();
        if (colLower === 'customslug') urlDto.customSlug = value;
        else if (colLower === 'title') urlDto.title = value;
        else if (colLower === 'password') urlDto.password = value;
        else if (colLower === 'expiresat') urlDto.expiresAt = value;
        else if (colLower === 'utmsource') urlDto.utmSource = value;
        else if (colLower === 'utmmedium') urlDto.utmMedium = value;
        else if (colLower === 'utmcampaign') urlDto.utmCampaign = value;
        else if (colLower === 'utmterm') urlDto.utmTerm = value;
        else if (colLower === 'utmcontent') urlDto.utmContent = value;
      });

      urls.push(urlDto);
    }

    return urls;
  };

  // CSV line parser (handles quoted values with commas and escaped quotes)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("") - add single quote and skip next
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleUpload = async () => {
    if (parsedUrls.length === 0) return;

    try {
      const res = await bulkCreate.mutateAsync(parsedUrls);
      setResult(res);

      if (res.successCount > 0) {
        toast({
          title: t('common.success'),
          description: t('urls.bulk.createSuccess', {
            success: res.successCount,
            total: res.total
          }),
        });
        onSuccess();
      }

      if (res.failureCount > 0 && res.successCount === 0) {
        toast({
          title: t('common.error'),
          description: t('urls.bulk.createAllFailed'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('urls.bulk.createError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      CSV_COLUMNS.join(','),
      'https://example.com/page1,my-link,My Link Title,,,newsletter,email,summer2024,,',
      'https://example.com/page2,,Another Link,,2025-12-31T23:59:59Z,,,,,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-urls-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setParsedUrls([]);
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-150 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('urls.bulk.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('urls.bulk.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
            <div>
              <p className="text-sm font-medium">{t('urls.bulk.downloadTemplate')}</p>
              <p className="text-xs text-muted-foreground">
                {t('urls.bulk.templateDescription')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              {t('urls.bulk.download')}
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">{t('urls.bulk.uploadCsv')}</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={bulkCreate.isPending}
            />
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
              {parseError}
            </div>
          )}

          {/* Parsed Preview */}
          {parsedUrls.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {t('urls.bulk.preview', { count: parsedUrls.length })}
                </span>
              </div>
              <ScrollArea className="h-50 rounded-md border">
                <div className="p-4 space-y-2">
                  {parsedUrls.slice(0, 10).map((url, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-muted-foreground">{index + 1}.</span>{' '}
                      <span className="font-mono">{url.originalUrl}</span>
                      {url.customSlug && (
                        <span className="ml-2 text-muted-foreground">→ {url.customSlug}</span>
                      )}
                    </div>
                  ))}
                  {parsedUrls.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      {t('urls.bulk.andMore', { count: parsedUrls.length - 10 })}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Result Summary */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{result.successCount}</p>
                    <p className="text-sm text-muted-foreground">{t('urls.bulk.succeeded')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{result.failureCount}</p>
                    <p className="text-sm text-muted-foreground">{t('urls.bulk.failed')}</p>
                  </div>
                </div>
              </div>

              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">{t('urls.bulk.failedDetails')}</p>
                  <ScrollArea className="h-37.5 rounded-md border">
                    <div className="p-4 space-y-2">
                      {result.failed.map((item) => (
                        <div key={item.index} className="text-sm">
                          <span className="text-muted-foreground">#{item.index + 1}:</span>{' '}
                          <span className="font-mono">{item.data.originalUrl}</span>
                          <p className="text-destructive ml-4">{item.error}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? t('common.close') : t('common.cancel')}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={parsedUrls.length === 0 || bulkCreate.isPending}
            >
              {bulkCreate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              {t('urls.bulk.uploadAndCreate', { count: parsedUrls.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
