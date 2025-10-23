/**
 * URL List Component
 */

'use client';

import { t } from '@/lib/i18n';
import { useState } from 'react';
import { useUrls, useDeleteUrl } from '@/hooks/use-url';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { formatDateTime, formatNumber, truncateUrl, copyToClipboard } from '@/lib/utils';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';

const statusVariant = {
  ACTIVE: 'success' as const,
  INACTIVE: 'warning' as const,
  EXPIRED: 'destructive' as const,
};

const statusText = {
  ACTIVE: 'urls.statusActive' as const,
  INACTIVE: 'urls.statusInactive' as const,
  EXPIRED: 'urls.statusExpired' as const,
};

export function UrlList() {
  const [page, setPage] = useState(1);
  const { data, isPending, error } = useUrls({ page, pageSize: 10 });
  const deleteUrl = useDeleteUrl();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (shortUrl: string, id: string) => {
    const success = await copyToClipboard(shortUrl);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('urls.deleteConfirm'))) {
      try {
        await deleteUrl.mutateAsync(id);
      } catch (error) {
        alert(t('urls.deleteError'));
      }
    }
  };

  if (isPending) {
    return <Loading text={t('common.loading')} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{t('urls.loadError').replace('{error}', error.message)}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">{t('urls.noUrlsYet')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('urls.listTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('urls.shortUrl')}</TableHead>
              <TableHead>{t('urls.originalUrl')}</TableHead>
              <TableHead>{t('urls.titleOptional')}</TableHead>
              <TableHead>{t('urls.status')}</TableHead>
              <TableHead className="text-right">{t('urls.clicks')}</TableHead>
              <TableHead>{t('urls.createdAt')}</TableHead>
              <TableHead className="text-right">{t('urls.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((url) => (
              <TableRow key={url.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                      {url.slug}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(url.shortUrl, url.id)}
                      title={copiedId === url.id ? t('common.copied') : t('common.copy')}
                    >
                      {copiedId === url.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={url.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    title={url.originalUrl}
                  >
                    {truncateUrl(url.originalUrl, 40)}
                  </a>
                </TableCell>
                <TableCell>{url.title || '-'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[url.status]}>
                    {t(statusText[url.status])}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(url.clickCount)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDateTime(url.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/urls/${url.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        {t('common.view')}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(url.id)}
                      disabled={deleteUrl.isPending}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.page')} {data.page} {t('common.of')} {data.totalPages} （{t('common.total')} {data.total} {t('common.items')}）
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                {t('common.previous')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
