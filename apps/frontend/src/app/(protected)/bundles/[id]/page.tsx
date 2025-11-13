'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import {
  useBundle,
  useBundleStats,
  useDeleteBundle,
  useArchiveBundle,
  useRestoreBundle,
  useRemoveUrlFromBundle,
  useAddUrlToBundle,
} from '@/hooks/use-bundles';
import { useUrls } from '@/hooks/use-url';
import { BundleDialog } from '@/components/bundles/bundle-dialog';
import {
  Package,
  ArrowLeft,
  Edit,
  MoreVertical,
  Trash2,
  Archive,
  ArchiveRestore,
  Loader2,
  MousePointerClick,
  Link as LinkIcon,
  TrendingUp,
  Copy,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bundleId = params.id as string;
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [removeUrlDialogOpen, setRemoveUrlDialogOpen] = useState(false);
  const [addUrlDialogOpen, setAddUrlDialogOpen] = useState(false);
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
  const [urlToAdd, setUrlToAdd] = useState<string>('');

  // Fetch data
  const { data: bundle, isLoading, error } = useBundle(bundleId);
  const { data: stats } = useBundleStats(bundleId);
  const { data: availableUrls } = useUrls({ page: 1, pageSize: 100, status: 'ACTIVE' });

  // Mutations
  const deleteMutation = useDeleteBundle();
  const archiveMutation = useArchiveBundle();
  const restoreMutation = useRestoreBundle();
  const removeUrlMutation = useRemoveUrlFromBundle();
  const addUrlMutation = useAddUrlToBundle();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(bundleId);
      toast({
        title: t('common.success'),
        description: t('bundles.deleteSuccess'),
      });
      router.push('/bundles');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(bundleId);
      toast({
        title: t('common.success'),
        description: t('bundles.archiveSuccess'),
      });
      setArchiveDialogOpen(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(bundleId);
      toast({
        title: t('common.success'),
        description: t('bundles.restoreSuccess'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const handleRemoveUrl = async () => {
    if (!selectedUrlId) return;

    try {
      await removeUrlMutation.mutateAsync({ bundleId, urlId: selectedUrlId });
      toast({
        title: t('common.success'),
        description: t('bundles.removeUrlSuccess'),
      });
      setRemoveUrlDialogOpen(false);
      setSelectedUrlId(null);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const handleAddUrl = async () => {
    if (!urlToAdd) return;

    try {
      await addUrlMutation.mutateAsync({
        bundleId,
        data: { urlId: urlToAdd },
      });
      toast({
        title: t('common.success'),
        description: t('bundles.addUrlSuccess'),
      });
      setAddUrlDialogOpen(false);
      setUrlToAdd('');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const handleCopyShortUrl = async (shortUrl: string) => {
    await navigator.clipboard.writeText(shortUrl);
    toast({
      title: t('common.copied'),
      description: t('urls.shortUrlCopied'),
    });
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{t('common.error')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !bundle) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Filter available URLs to exclude those already in the bundle
  const bundleUrlIds = bundle.urls?.map((url) => url.id) || [];
  const filteredAvailableUrls = availableUrls?.data.filter(
    (url) => !bundleUrlIds.includes(url.id)
  ) || [];

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/bundles')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{bundle.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{bundle.name}</h1>
              {bundle.description && (
                <p className="text-muted-foreground mt-1">{bundle.description}</p>
              )}
            </div>
          </div>
          <Badge variant={bundle.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {bundle.status === 'ACTIVE' ? t('bundles.active') : t('bundles.archived')}
          </Badge>
        </div>

        <div className="flex gap-2">
          {bundle.status === 'ACTIVE' && (
            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {bundle.status === 'ACTIVE' ? (
                <DropdownMenuItem onClick={() => setArchiveDialogOpen(true)}>
                  <Archive className="mr-2 h-4 w-4" />
                  {t('bundles.archive')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleRestore}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {t('bundles.restore')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('bundles.totalClicks')}</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalClicks.toLocaleString() || bundle.totalClicks.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <MousePointerClick className="mr-1 h-3 w-3" />
              {t('urls.cumulativeVisits')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('bundles.urlCount')}</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.urlCount || bundle.urlCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <LinkIcon className="mr-1 h-3 w-3" />
              {t('bundles.totalClicks')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('bundles.topUrl')}</CardDescription>
            <CardTitle className="text-lg truncate">
              {stats?.topUrl?.slug || '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3" />
              {stats?.topUrl?.clicks
                ? `${stats.topUrl.clicks.toLocaleString()} ${t('common.clicks')}`
                : t('bundles.stats.noData')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Click Trend Chart */}
      {stats && stats.clickTrend.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('bundles.clickTrend')}</CardTitle>
            <CardDescription>{t('bundles.stats.clicksByDate')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.clickTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    return formatDate(value as string);
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke={bundle.color}
                  strokeWidth={2}
                  dot={{ fill: bundle.color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* URLs in Bundle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                {t('bundles.addUrls')} ({bundle.urls?.length || 0})
              </CardTitle>
              <CardDescription className="mt-2">
                {t('bundles.stats.urlPerformance')}
              </CardDescription>
            </div>
            {bundle.status === 'ACTIVE' && filteredAvailableUrls.length > 0 && (
              <Button onClick={() => setAddUrlDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('bundles.addUrls')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bundle.urls && bundle.urls.length > 0 ? (
            <div className="space-y-3">
              {bundle.urls.map((url) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{url.title || url.slug}</h4>
                      <Badge variant="outline">{url.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {url.originalUrl}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {t('bundles.totalClicks')}: {url.clickCount.toLocaleString()}
                      </span>
                      <span>
                        {t('urls.createdAtCard')}: {formatDate(url.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyShortUrl(url.shortUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Link
                      href={url.shortUrl}
                      target="_blank"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    {bundle.status === 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUrlId(url.id);
                          setRemoveUrlDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {t('bundles.emptyBundle')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('bundles.emptyBundleDescription')}
              </p>
              {bundle.status === 'ACTIVE' && filteredAvailableUrls.length > 0 && (
                <Button
                  className="mt-6"
                  onClick={() => setAddUrlDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('bundles.addUrls')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <BundleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bundle={bundle}
      />

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

      {/* Remove URL Confirmation */}
      <AlertDialog open={removeUrlDialogOpen} onOpenChange={setRemoveUrlDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bundles.removeUrl')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bundles.confirmRemoveUrl')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUrl}>
              {removeUrlMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.remove')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add URL Dialog */}
      <AlertDialog open={addUrlDialogOpen} onOpenChange={setAddUrlDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bundles.addUrls')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bundles.selectUrls')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={urlToAdd} onValueChange={setUrlToAdd}>
              <SelectTrigger>
                <SelectValue placeholder={t('bundles.selectUrls')} />
              </SelectTrigger>
              <SelectContent>
                {filteredAvailableUrls.map((url) => (
                  <SelectItem key={url.id} value={url.id}>
                    {url.title || url.slug} - {url.originalUrl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUrlToAdd('')}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAddUrl} disabled={!urlToAdd}>
              {addUrlMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.add')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
