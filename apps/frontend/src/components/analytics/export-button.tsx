/**
 * Export Button Component
 * Download analytics data as CSV or JSON
 */

'use client';

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
import { useExportAnalytics } from '@/hooks/use-analytics';
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
  const { toast } = useToast();
  const { mutateAsync, isPending: isExporting } = useExportAnalytics();

  const onExport = async (format: ExportFormat) => {
    try {
      await mutateAsync({ format, urlId, queryParams, includeClicks });
      toast({
        title: t('export.exportSuccess'),
        description: t('export.exportSuccessDesc'),
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('export.exportError'),
        description: t('export.exportErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? t('export.exporting') : t('export.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t('export.exportAsCSV')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('json')}>
          <FileJson className="h-4 w-4 mr-2" />
          {t('export.exportAsJSON')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
