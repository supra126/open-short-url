'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { useVariants, useDeleteVariant, type VariantResponseDto, type VariantStatsDto } from '@/hooks/use-variants';
import { VariantDialog } from './variant-dialog';
import {
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  Users,
  TestTube2,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface VariantListProps {
  urlId: string;
}

interface ChartDataEntry {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function VariantList({ urlId }: VariantListProps) {
  const { data, isLoading, error } = useVariants(urlId);
  const deleteMutation = useDeleteVariant();
  const { toast } = useToast();

  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteVariantId) return;

    try {
      await deleteMutation.mutateAsync({ urlId, variantId: deleteVariantId });

      toast({
        title: t('variants.deleted'),
        description: t('variants.deletedDesc'),
      });

      setDeleteVariantId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('variants.deleteErrorDesc');
      toast({
        title: t('variants.deleteError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            {t('variants.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            {t('variants.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>{t('variants.loadError')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const variants = data?.variants || [];
  const hasVariants = variants.length > 0;

  // Extract control group from stats (id: 'control-group')
  const controlGroup = data?.stats.find(
    (stat: VariantStatsDto) => stat.variant.id === 'control-group'
  );
  const hasControlGroup = !!controlGroup;

  // Prepare chart data (includes control group if exists)
  const chartData =
    data?.stats.map((stat: VariantStatsDto, index: number) => ({
      name: stat.variant.name,
      value: stat.variant.clickCount,
      percentage: stat.clickThroughRate,
      color: COLORS[index % COLORS.length],
    })) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube2 className="h-5 w-5" />
                {t('variants.title')}
              </CardTitle>
              <CardDescription>{t('variants.description')}</CardDescription>
            </div>
            <VariantDialog urlId={urlId} />
          </div>
        </CardHeader>
        <CardContent>
          {!hasVariants ? (
            <div className="text-center py-12">
              <TestTube2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('variants.noVariants')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('variants.noVariantsDesc')}
              </p>
              <VariantDialog
                urlId={urlId}
                trigger={
                  <Button>
                    <TestTube2 className="mr-2 h-4 w-4" />
                    {t('variants.createFirst')}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('variants.variantsCount')}
                    </CardTitle>
                    <TestTube2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{variants.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('variants.activeCount', {
                        count: variants.filter((v: VariantResponseDto) => v.isActive).length,
                      })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('variants.totalClicks')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data?.totalClicks.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('variants.totalClicksDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('variants.bestPerformer')}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data?.stats[0]?.variant.name || '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('variants.bestPerformerRate', {
                        rate: data?.stats[0]?.clickThroughRate?.toFixed(1) ?? '0',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              {data && data.totalClicks > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('variants.trafficDistribution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(1)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry: ChartDataEntry, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Variants Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('variants.name')}</TableHead>
                      <TableHead>{t('variants.targetUrl')}</TableHead>
                      <TableHead className="text-center">
                        {t('variants.weight')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('variants.clicks')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('variants.clickRate')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('variants.status')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Control Group Row (if exists) */}
                    {hasControlGroup && controlGroup && (
                      <TableRow key="control-group" className="bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {t('variants.controlGroup')}
                            <Badge variant="outline" className="text-xs">
                              {t('variants.controlGroup').split('(')[0].trim()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          <a
                            href={controlGroup.variant.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {controlGroup.variant.targetUrl}
                          </a>
                        </TableCell>
                        <TableCell className="text-center">
                          {controlGroup.variant.weight}%
                        </TableCell>
                        <TableCell className="text-center">
                          {controlGroup.variant.clickCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {controlGroup.clickThroughRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default">
                            {t('variants.statusActive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title={t('variants.controlGroupNotEditable')}
                            >
                              <Edit className="h-4 w-4 opacity-50" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title={t('variants.controlGroupNotEditable')}
                            >
                              <Trash2 className="h-4 w-4 opacity-50" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Regular Variants */}
                    {variants.map((variant: VariantResponseDto) => {
                      const stat = data?.stats.find(
                        (s: VariantStatsDto) => s.variant.id === variant.id
                      );
                      return (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">
                            {variant.name}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            <a
                              href={variant.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {variant.targetUrl}
                            </a>
                          </TableCell>
                          <TableCell className="text-center">
                            {variant.weight}%
                          </TableCell>
                          <TableCell className="text-center">
                            {variant.clickCount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {stat?.clickThroughRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                variant.isActive ? 'default' : 'secondary'
                              }
                            >
                              {variant.isActive
                                ? t('variants.statusActive')
                                : t('variants.statusInactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <VariantDialog
                                urlId={urlId}
                                variant={variant}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteVariantId(variant.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteVariantId}
        onOpenChange={(open) => !open && setDeleteVariantId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('variants.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('variants.deleteConfirmDesc')}
              {variants.length === 1 && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-500">
                  {t('variants.deleteLastWarning')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
