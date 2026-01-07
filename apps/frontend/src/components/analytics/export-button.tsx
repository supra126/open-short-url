/**
 * Export Button Component
 * Download analytics data as CSV or JSON
 */

'use client';

import { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { AnalyticsQueryParams, ExportFormat } from '@/hooks/use-analytics';

interface ExportButtonProps {
  /** URL ID for single URL export, undefined for overview export */
  urlId?: string;
  /** Query parameters for date range filtering */
  queryParams: AnalyticsQueryParams;
  /** Include detailed click records */
  includeClicks?: boolean;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({
  urlId,
  queryParams,
  includeClicks = false,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4101';

      // Build query string
      const params = new URLSearchParams();
      params.append('format', format);

      if (queryParams.timeRange) {
        params.append('timeRange', queryParams.timeRange);
      }
      if (queryParams.startDate) {
        params.append('startDate', queryParams.startDate);
      }
      if (queryParams.endDate) {
        params.append('endDate', queryParams.endDate);
      }
      if (includeClicks) {
        params.append('includeClicks', 'true');
      }

      // Build endpoint URL
      const endpoint = urlId
        ? `/api/analytics/urls/${urlId}/export`
        : '/api/analytics/export';

      const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        // Handle authentication error
        if (response.status === 401) {
          const redirectUrl = window.location.pathname + window.location.search;
          const safeRedirect = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')
            ? redirectUrl
            : '/';
          window.location.href = `/login?redirect=${encodeURIComponent(safeRedirect)}`;
          return;
        }
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `analytics_export.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success toast
      toast({
        title: t('export.exportSuccess'),
        description: t('export.exportSuccessDesc'),
      });
    } catch (error) {
      console.error('Export failed:', error);
      // Show error toast
      toast({
        title: t('export.exportError'),
        description: t('export.exportErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [urlId, queryParams, includeClicks, toast]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? t('export.exporting') : t('export.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t('export.exportAsCSV')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="h-4 w-4 mr-2" />
          {t('export.exportAsJSON')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
