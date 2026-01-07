/**
 * URL List Component with Bulk Selection
 */

'use client';

import { t } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { useUrls, useDeleteUrl, type UrlResponseDto } from '@/hooks/use-url';
import { useBulkDeleteUrls } from '@/hooks/use-bulk-urls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Copy, Check, ChevronDown, Trash2, Edit, X } from 'lucide-react';
import { BulkEditDialog } from './bulk-edit-dialog';
import { BulkCreateDialog } from './bulk-create-dialog';

type UrlStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

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

export function UrlList() {
  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch } = useUrls({ page, pageSize: 10 });
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
      setSelectedIds(new Set(data.data.map((url) => url.id)));
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

  // Check states
  const allSelected = data && data.data.length > 0 && selectedIds.size === data.data.length;
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
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">{t('urls.noUrlsYet')}</p>
          <Button
            className="mt-4"
            onClick={() => setBulkCreateDialogOpen(true)}
          >
            {t('urls.bulk.createButton')}
          </Button>
        </CardContent>

        <BulkCreateDialog
          open={bulkCreateDialogOpen}
          onOpenChange={setBulkCreateDialogOpen}
          onSuccess={handleBulkCreateSuccess}
        />
      </Card>
    );
  }

  return (
    <>
      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('urls.listTitle')}</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setBulkCreateDialogOpen(true)}
          >
            {t('urls.bulk.createButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
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
                <TableHead className="text-right">{t('urls.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((url: UrlResponseDto) => (
                <TableRow
                  key={url.id}
                  data-state={selectedIds.has(url.id) ? 'selected' : undefined}
                >
                  <TableCell>
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
                    <Badge variant={statusVariant[url.status as UrlStatus]}>
                      {t(statusText[url.status as UrlStatus] as Parameters<typeof t>[0])}
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
                        <Button size="sm" variant="outline">
                          {t('common.view')}
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(url.id)}
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
                      ⚠️ {t('urls.bulk.largeBatchWarning', { count: selectedIds.size })}
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
                        placeholder="DELETE"
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
