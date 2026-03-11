/**
 * URL List Component with Bulk Selection, Search, and Responsive Layout
 */

'use client';

import { t } from '@/lib/i18n';
import { useState, useEffect, useMemo } from 'react';
import { useUrls, useDeleteUrl } from '@/hooks/use-url';
import { useBulkDeleteUrls } from '@/hooks/use-bulk-urls';
import type { UrlStatus, UrlResponseDto } from '@/hooks/use-url';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loading } from '@/components/ui/loading';
import { formatDateTime, formatNumber, truncateUrl, copyToClipboard } from '@/lib/utils';
import Link from 'next/link';
import { Copy, Check, ChevronDown, Trash2, Edit, X, Search, LinkIcon, MousePointerClick, ExternalLink } from 'lucide-react';
import { BulkEditDialog } from './bulk-edit-dialog';
import { BulkCreateDialog } from './bulk-create-dialog';

const statusVariant: Record<UrlStatus, 'success' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  EXPIRED: 'destructive',
};

const statusText: Record<UrlStatus, string> = {
  ACTIVE: 'urls.statusActive',
  INACTIVE: 'urls.statusInactive',
  EXPIRED: 'urls.statusExpired',
};

// Threshold for requiring extra confirmation on bulk delete
const LARGE_BATCH_THRESHOLD = 50;

// Page size options
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function UrlList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isPending, error, refetch } = useUrls({ page, pageSize });
  const deleteUrl = useDeleteUrl();
  const bulkDeleteUrls = useBulkDeleteUrls();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Clear selection and close dialogs when page changes
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkDeleteDialogOpen(false);
    setDeleteConfirmText('');
  }, [page]);

  // Client-side filter
  const filteredData = useMemo(() => {
    if (!data?.data || !searchQuery.trim()) return data?.data || [];
    const q = searchQuery.toLowerCase();
    return data.data.filter(
      (url: UrlResponseDto) =>
        url.slug.toLowerCase().includes(q) ||
        url.originalUrl.toLowerCase().includes(q) ||
        (url.title && url.title.toLowerCase().includes(q))
    );
  }, [data?.data, searchQuery]);

  const handleCopy = async (shortUrl: string, id: string) => {
    const success = await copyToClipboard(shortUrl);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteClick = (id: string) => {
    setUrlToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!urlToDelete) return;

    try {
      await deleteUrl.mutateAsync(urlToDelete);
      toast({
        title: t('common.success'),
        description: t('urls.deleteSuccess'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('urls.deleteError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setUrlToDelete(null);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true && data) {
      setSelectedIds(new Set(filteredData.map((url: UrlResponseDto) => url.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean | 'indeterminate') => {
    const newSet = new Set(selectedIds);
    if (checked === true) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const result = await bulkDeleteUrls.mutateAsync(Array.from(selectedIds));
      toast({
        title: t('common.success'),
        description: t('urls.bulk.deleteSuccess', { count: result.deletedCount }),
      });
      setSelectedIds(new Set());
    } catch (error) {
      const message = error instanceof Error ? error.message : t('urls.bulk.deleteError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkEditSuccess = () => {
    setSelectedIds(new Set());
    refetch();
  };

  const handleBulkCreateSuccess = () => {
    refetch();
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  // Check states
  const allSelected = filteredData.length > 0 && selectedIds.size === filteredData.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

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
      <>
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <LinkIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-display font-semibold">{t('urls.noUrlsYet')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('urls.emptyStateDesc')}</p>
              </div>
              <Button onClick={() => setBulkCreateDialogOpen(true)}>
                {t('urls.bulk.createButton')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <BulkCreateDialog
          open={bulkCreateDialogOpen}
          onOpenChange={setBulkCreateDialogOpen}
          onSuccess={handleBulkCreateSuccess}
        />
      </>
    );
  }

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 opacity-0 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('urls.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} {t('common.items')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setBulkCreateDialogOpen(true)}
          >
            {t('urls.bulk.createButton')}
          </Button>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-primary/5 border-primary/20 p-3 animate-slide-down">
          <span className="text-sm font-medium">
            {t('urls.bulk.selected', { count: selectedIds.size })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {t('urls.bulk.actions')}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setBulkEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('urls.bulk.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('urls.bulk.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            <X className="mr-1 h-4 w-4" />
            {t('urls.bulk.clearSelection')}
          </Button>
        </div>
      )}

      {/* Desktop Table View */}
      <Card className="hidden md:block opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAll}
                    aria-label={t('urls.bulk.selectAll')}
                  />
                </TableHead>
                <TableHead>{t('urls.shortUrl')}</TableHead>
                <TableHead>{t('urls.originalUrl')}</TableHead>
                <TableHead>{t('urls.titleOptional')}</TableHead>
                <TableHead>{t('urls.status')}</TableHead>
                <TableHead className="text-right">{t('urls.clicks')}</TableHead>
                <TableHead>{t('urls.createdAt')}</TableHead>
                <TableHead className="text-right pr-4">{t('urls.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((url: UrlResponseDto) => (
                <TableRow
                  key={url.id}
                  data-state={selectedIds.has(url.id) ? 'selected' : undefined}
                  className="group"
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedIds.has(url.id)}
                      onCheckedChange={(checked) => handleSelectOne(url.id, checked)}
                      aria-label={t('urls.bulk.selectRow')}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-sm">
                        {url.slug}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(url.shortUrl, url.id)}
                        aria-label={copiedId === url.id ? t('common.copied') : t('common.copy')}
                      >
                        {copiedId === url.id ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
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
                  <TableCell className="text-muted-foreground">{url.title || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[url.status as UrlStatus]}>
                      {t(statusText[url.status as UrlStatus] as Parameters<typeof t>[0])}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(url.clickCount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(url.createdAt)}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/urls/${url.id}`}>
                        <Button size="sm" variant="outline">
                          {t('common.view')}
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(url.id)}
                        disabled={deleteUrl.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {filteredData.map((url: UrlResponseDto) => (
          <Card
            key={url.id}
            className={`${selectedIds.has(url.id) ? 'border-primary/40 bg-primary/5' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(url.id)}
                  onCheckedChange={(checked) => handleSelectOne(url.id, checked)}
                  aria-label={t('urls.bulk.selectRow')}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-sm font-medium truncate">
                      {url.slug}
                    </code>
                    <Badge variant={statusVariant[url.status as UrlStatus]} className="shrink-0">
                      {t(statusText[url.status as UrlStatus] as Parameters<typeof t>[0])}
                    </Badge>
                  </div>
                  {url.title && (
                    <p className="text-sm font-medium truncate">{url.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{truncateUrl(url.originalUrl, 50)}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {formatNumber(url.clickCount)} {t('urls.clicks')}
                    </div>
                    <span>{formatDateTime(url.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => handleCopy(url.shortUrl, url.id)}
                      aria-label={t('common.copy')}
                    >
                      {copiedId === url.id ? (
                        <Check className="h-3.5 w-3.5 text-success mr-1" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1" />
                      )}
                      {copiedId === url.id ? t('common.copied') : t('common.copy')}
                    </Button>
                    <Link href={`/urls/${url.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-8">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        {t('common.view')}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(url.id)}
                      disabled={deleteUrl.isPending}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t('common.page')} {data.page} {t('common.of')} {data.totalPages} ({t('common.total')} {data.total} {t('common.items')})
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              {t('common.previous')}
            </Button>
            {page > 2 && page < data.totalPages - 1 && (
              <Button size="sm" variant="default" disabled>
                {page}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === data.totalPages}
            >
              {t('common.next')}
            </Button>
            {data.totalPages > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(data.totalPages)}
                disabled={page === data.totalPages}
              >
                {data.totalPages}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('urls.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('urls.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => {
          setBulkDeleteDialogOpen(open);
          if (!open) setDeleteConfirmText('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('urls.bulk.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {selectedIds.size >= LARGE_BATCH_THRESHOLD ? (
                  <>
                    <p className="text-destructive font-medium">
                      {t('urls.bulk.largeBatchWarning', { count: selectedIds.size })}
                    </p>
                    <p>{t('urls.bulk.deleteConfirmDescription', { count: selectedIds.size })}</p>
                    <div className="pt-2">
                      <Label htmlFor="delete-confirm" className="text-sm">
                        {t('urls.bulk.typeDeleteToConfirm')}
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={t('urls.bulk.deleteConfirmPlaceholder')}
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  <p>{t('urls.bulk.deleteConfirmDescription', { count: selectedIds.size })}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                bulkDeleteUrls.isPending ||
                (selectedIds.size >= LARGE_BATCH_THRESHOLD && deleteConfirmText !== 'DELETE')
              }
            >
              {bulkDeleteUrls.isPending ? t('common.loading') : t('urls.bulk.deleteConfirmButton', { count: selectedIds.size })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        selectedIds={Array.from(selectedIds)}
        onSuccess={handleBulkEditSuccess}
      />

      {/* Bulk Create Dialog */}
      <BulkCreateDialog
        open={bulkCreateDialogOpen}
        onOpenChange={setBulkCreateDialogOpen}
        onSuccess={handleBulkCreateSuccess}
      />
    </>
  );
}
