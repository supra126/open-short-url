/**
 * Recent URLs Component
 * Displays recently created short URLs with quick actions
 */

'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';
import { copyToClipboard, truncateUrl, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { UrlResponseDto } from '@/hooks/use-url';

interface RecentUrlsProps {
  urls: UrlResponseDto[];
  isLoading?: boolean;
  baseUrl?: string;
}

// URL item component
const UrlItem = memo<{
  url: UrlResponseDto;
  baseUrl: string;
  onCopy: (shortUrl: string) => void;
}>(({ url, baseUrl, onCopy }) => {
  const shortUrl = `${baseUrl}/${url.slug}`;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex-1 min-w-0 mr-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/urls/${url.id}`}
            className="text-sm font-medium hover:underline truncate"
          >
            {url.title || `/${url.slug}`}
          </Link>
          {url.status === 'INACTIVE' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {t('urls.statusInactive')}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {truncateUrl(url.originalUrl, 40)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(url.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCopy(shortUrl)}
          title={t('common.copy')}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
        >
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" title={t('common.view')}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
});
UrlItem.displayName = 'UrlItem';

// Loading skeleton
const UrlsSkeleton = memo(() => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
));
UrlsSkeleton.displayName = 'UrlsSkeleton';

export const RecentUrls = memo<RecentUrlsProps>(
  ({ urls, isLoading, baseUrl = '' }) => {
    const { toast } = useToast();

    const handleCopy = useCallback(
      async (shortUrl: string) => {
        const success = await copyToClipboard(shortUrl);
        if (success) {
          toast({
            title: t('common.copied'),
            description: t('urls.shortUrlCopiedDesc'),
          });
        }
      },
      [toast],
    );

    // Get base URL from environment or window
    const resolvedBaseUrl =
      baseUrl ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SHORT_URL_BASE || '');

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {t('dashboard.recentUrls')}
              </CardTitle>
              <CardDescription>{t('dashboard.recentUrlsDesc')}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/urls" className="flex items-center gap-1">
                {t('dashboard.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <UrlsSkeleton />
          ) : urls.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t('dashboard.noUrlsYet')}
              </p>
              <Button asChild>
                <Link href="/urls/new">{t('dashboard.createFirstUrl')}</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {urls.map((url) => (
                <UrlItem
                  key={url.id}
                  url={url}
                  baseUrl={resolvedBaseUrl}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
RecentUrls.displayName = 'RecentUrls';
