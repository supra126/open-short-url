/**
 * Top Performing URLs Component
 * Displays URLs with the highest click counts
 */

'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatNumber, truncateUrl } from '@/lib/utils';
import type { UrlResponseDto } from '@/hooks/use-url';

interface TopPerformingUrlsProps {
  urls: UrlResponseDto[] | { id: string; slug: string; title?: string | null; originalUrl: string; clickCount: number; status: string }[];
  isLoading?: boolean;
}

// Progress bar for click visualization
const ClickBar = memo<{
  clicks: number;
  maxClicks: number;
}>(({ clicks, maxClicks }) => {
  const percentage = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">
        {formatNumber(clicks)}
      </span>
    </div>
  );
});
ClickBar.displayName = 'ClickBar';

// URL item component
const TopUrlItem = memo<{
  url: { id: string; slug: string; title?: string | null; originalUrl: string; clickCount: number; status: string };
  maxClicks: number;
  rank: number;
}>(({ url, maxClicks, rank }) => (
  <div className="flex items-start gap-3 py-2 border-b last:border-0">
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
      {rank}
    </div>
    <div className="flex-1 min-w-0 space-y-1">
      <Link
        href={`/urls/${url.id}`}
        className="text-sm font-medium hover:underline truncate block"
      >
        {url.title || `/${url.slug}`}
      </Link>
      <p className="text-xs text-muted-foreground truncate">
        {truncateUrl(url.originalUrl, 35)}
      </p>
      <ClickBar clicks={url.clickCount} maxClicks={maxClicks} />
    </div>
  </div>
));
TopUrlItem.displayName = 'TopUrlItem';

// Loading skeleton
const TopUrlsSkeleton = memo(() => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 py-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    ))}
  </div>
));
TopUrlsSkeleton.displayName = 'TopUrlsSkeleton';

// Empty state component
const EmptyState = memo(() => (
  <div className="py-8 flex flex-col items-center justify-center text-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
    <p className="text-sm text-muted-foreground">{t('dashboard.noTopUrls')}</p>
    <p className="text-xs text-muted-foreground mt-1">
      {t('dashboard.noTopUrlsDesc')}
    </p>
  </div>
));
EmptyState.displayName = 'EmptyState';

export const TopPerformingUrls = memo<TopPerformingUrlsProps>(
  ({ urls, isLoading }) => {
    // Filter and sort by click count
    const sortedUrls = useMemo(() => {
      return [...urls]
        .filter((url) => url.clickCount > 0)
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 5);
    }, [urls]);

    const maxClicks = useMemo(
      () => Math.max(...sortedUrls.map((u) => u.clickCount), 1),
      [sortedUrls],
    );

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-base">
                {t('dashboard.topPerforming')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.topPerformingDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TopUrlsSkeleton />
          ) : sortedUrls.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y">
              {sortedUrls.map((url, index) => (
                <TopUrlItem
                  key={url.id}
                  url={url}
                  maxClicks={maxClicks}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
TopPerformingUrls.displayName = 'TopPerformingUrls';
