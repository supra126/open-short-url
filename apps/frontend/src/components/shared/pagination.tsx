/**
 * Shared Pagination Component
 *
 * Provides consistent pagination UI across all list pages.
 * Includes first/last page jump buttons, previous/next navigation,
 * and a current page indicator.
 */

'use client';

import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className ?? ''}`}
    >
      <p className="text-sm text-muted-foreground">
        {t('common.page')} {page} {t('common.of')} {totalPages} ({t('common.total')} {total} {t('common.items')})
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          1
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          {t('common.previous')}
        </Button>
        {page > 2 && page < totalPages - 1 && (
          <Button size="sm" variant="default" disabled>
            {page}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          {t('common.next')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
        >
          {totalPages}
        </Button>
      </div>
    </div>
  );
}
