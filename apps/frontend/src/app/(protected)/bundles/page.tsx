'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  useBundles,
  useDeleteBundle,
  useArchiveBundle,
  useRestoreBundle,
} from '@/hooks/use-bundles';
import { BundleDialog } from '@/components/bundles/bundle-dialog';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Archive,
  ArchiveRestore,
  Search,
  ExternalLink,
  Link2,
  MousePointerClick,
} from 'lucide-react';
import type { BundleResponseDto } from '@/hooks/use-bundles';

// 預設顏色列表
const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#eab308', // yellow
];

function getBundleColor(bundle: BundleResponseDto, index: number): string {
  return bundle.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export default function BundlesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundleResponseDto | null>(
    null,
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query
  const { data, isLoading, error } = useBundles({
    page,
    pageSize,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
  });

  // Mutations
  const deleteMutation = useDeleteBundle();
  const archiveMutation = useArchiveBundle();
  const restoreMutation = useRestoreBundle();

  const handleDelete = async () => {
    if (!selectedBundle) return;

    try {
      await deleteMutation.mutateAsync(selectedBundle.id);
      toast({
        title: t('common.success'),
        description: t('bundles.deleteSuccess'),
      });
      setDeleteDialogOpen(false);
      setSelectedBundle(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common.tryAgainLater');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async () => {
    if (!selectedBundle) return;

    try {
      await archiveMutation.mutateAsync(selectedBundle.id);
      toast({
        title: t('common.success'),
        description: t('bundles.archiveSuccess'),
      });
      setArchiveDialogOpen(false);
      setSelectedBundle(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common.tryAgainLater');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleRestore = useCallback(async (bundle: BundleResponseDto) => {
    try {
      await restoreMutation.mutateAsync(bundle.id);
      toast({
        title: t('common.success'),
        description: t('bundles.restoreSuccess'),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common.tryAgainLater');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  }, [restoreMutation, toast]);

  const handleViewDetails = (bundleId: string) => {
    router.push(`/bundles/${bundleId}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="py-8 text-center">
          <p className="text-destructive">{t('common.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('bundles.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('bundles.description')}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('bundles.create')}
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('bundles.filters.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: 'ALL' | 'ACTIVE' | 'ARCHIVED') => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('bundles.filters.all')}</SelectItem>
            <SelectItem value="ACTIVE">
              {t('bundles.filters.active')}
            </SelectItem>
            <SelectItem value="ARCHIVED">
              {t('bundles.filters.archived')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          {/* Bundle Cards */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((bundle: BundleResponseDto, index: number) => {
              const color = getBundleColor(bundle, index);
              const isArchived = bundle.status === 'ARCHIVED';

              return (
                <Card
                  key={bundle.id}
                  className={`
                    group relative cursor-pointer overflow-hidden
                    transition-all duration-200
                    hover:shadow-lg hover:-translate-y-0.5
                    ${isArchived ? 'opacity-60' : ''}
                  `}
                  onClick={() => handleViewDetails(bundle.id)}
                >
                  {/* Colored Top Border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: color }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          {bundle.icon || '📦'}
                        </div>
                        <div>
                          <CardTitle className="text-lg line-clamp-1">
                            {bundle.name}
                          </CardTitle>
                          <Badge
                            variant={isArchived ? 'secondary' : 'default'}
                            className="mt-1"
                          >
                            {isArchived ? t('bundles.archived') : t('bundles.active')}
                          </Badge>
                        </div>
                      </div>
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isArchived ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBundle(bundle);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBundle(bundle);
                                setArchiveDialogOpen(true);
                              }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(bundle)}
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBundle(bundle);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bundle.description && (
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {bundle.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{bundle.urlCount}</span>
                        <span className="text-muted-foreground">{t('bundles.urls')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{bundle.totalClicks.toLocaleString()}</span>
                        <span className="text-muted-foreground">{t('bundles.clicks')}</span>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      className="mt-4 w-full p-0 h-auto"
                      onClick={() => handleViewDetails(bundle.id)}
                    >
                      {t('common.view')}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {page} {t('common.of')} {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {t('bundles.empty')}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('bundles.emptyDescription')}
          </p>
          <Button
            className="mt-6"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('bundles.create')}
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <BundleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Dialog */}
      {selectedBundle && (
        <BundleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          bundle={selectedBundle}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bundles.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bundles.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bundles.archive')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bundles.confirmArchive')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {archiveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('bundles.archive')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
