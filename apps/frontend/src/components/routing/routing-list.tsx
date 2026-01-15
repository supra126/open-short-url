'use client';

import { useState } from 'react';
import { t, type TranslationKey } from '@/lib/i18n';
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
import {
  useRoutingRules,
  useDeleteRoutingRule,
  type RoutingRuleResponseDto,
  type RoutingRuleStatDto,
} from '@/hooks/use-routing-rules';
import { RoutingRuleDialog } from './routing-rule-dialog';
import {
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  Route,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { formatNumber } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RoutingListProps {
  urlId: string;
}

interface ChartDataEntry {
  name: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: string | number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export function RoutingList({ urlId }: RoutingListProps) {
  const { data, isLoading, error } = useRoutingRules(urlId);
  const deleteMutation = useDeleteRoutingRule();
  const { toast } = useToast();

  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteRuleId) return;

    try {
      await deleteMutation.mutateAsync({ urlId, ruleId: deleteRuleId });

      toast({
        title: t('routing.deleted'),
        description: t('routing.deletedDesc'),
      });

      setDeleteRuleId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('routing.deleteErrorDesc');
      toast({
        title: t('routing.deleteError'),
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
            <Route className="h-5 w-5" />
            {t('routing.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8">
            <Loading />
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
            <Route className="h-5 w-5" />
            {t('routing.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>{t('routing.loadError')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rules = data?.rules || [];
  const hasRules = rules.length > 0;
  const totalMatches = data?.totalMatches || 0;
  const stats = data?.stats || [];

  // Prepare chart data
  const chartData: ChartDataEntry[] = stats.map((stat: RoutingRuleStatDto, index: number) => ({
    name: stat.name,
    value: stat.matchCount,
    percentage: stat.matchPercentage,
    color: COLORS[index % COLORS.length],
  }));

  const getConditionsSummary = (rule: RoutingRuleResponseDto): string => {
    const conditions = rule.conditions?.conditions || [];
    if (conditions.length === 0) return '-';

    const logic = rule.conditions?.operator || 'AND';
    const summaries = conditions.slice(0, 2).map((c) => {
      const typeLabel = t(`routing.conditionTypes.${c.type}` as TranslationKey);
      return `${typeLabel} ${c.operator}`;
    });

    const suffix = conditions.length > 2 ? ` +${conditions.length - 2}` : '';
    return summaries.join(` ${logic} `) + suffix;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                {t('routing.title')}
              </CardTitle>
              <CardDescription>{t('routing.description')}</CardDescription>
            </div>
            <RoutingRuleDialog urlId={urlId} />
          </div>
        </CardHeader>
        <CardContent>
          {!hasRules ? (
            <div className="text-center py-12">
              <Route className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('routing.noRules')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('routing.noRulesDesc')}
              </p>
              <RoutingRuleDialog
                urlId={urlId}
                trigger={
                  <Button>
                    <Route className="mr-2 h-4 w-4" />
                    {t('routing.createFirst')}
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
                      {t('routing.rulesCount')}
                    </CardTitle>
                    <Route className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{rules.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('routing.activeCount', {
                        count: rules.filter((r: RoutingRuleResponseDto) => r.isActive).length,
                      })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('routing.totalMatches')}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(totalMatches)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('routing.totalMatchesDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('routing.topRule')}
                    </CardTitle>
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold truncate">
                      {stats[0]?.name || '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('routing.topRulePercentage', {
                        percentage: stats[0]?.matchPercentage?.toFixed(1) ?? '0',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              {totalMatches > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('routing.trafficDistribution')}
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

              {/* Rules Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('routing.name')}</TableHead>
                      <TableHead>{t('routing.targetUrl')}</TableHead>
                      <TableHead>{t('routing.conditions')}</TableHead>
                      <TableHead className="text-center">
                        {t('routing.priority')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('routing.matches')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('routing.status')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule: RoutingRuleResponseDto) => {
                      const stat = stats.find((s: RoutingRuleStatDto) => s.ruleId === rule.id);
                      return (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">
                            {rule.name}
                          </TableCell>
                          <TableCell className="max-w-50 truncate">
                            <a
                              href={rule.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {rule.targetUrl}
                            </a>
                          </TableCell>
                          <TableCell className="max-w-50 truncate text-sm text-muted-foreground">
                            {getConditionsSummary(rule)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{rule.priority}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">
                                {formatNumber(rule.matchCount)}
                              </span>
                              {stat && (
                                <span className="text-xs text-muted-foreground">
                                  {stat.matchPercentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={rule.isActive ? 'default' : 'secondary'}
                            >
                              {rule.isActive
                                ? t('routing.statusActive')
                                : t('routing.statusInactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <RoutingRuleDialog
                                urlId={urlId}
                                rule={rule}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteRuleId(rule.id)}
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
        open={!!deleteRuleId}
        onOpenChange={(open) => !open && setDeleteRuleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('routing.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('routing.deleteConfirmDesc')}
              {rules.length === 1 && (
                <span className="block mt-2 text-warning">
                  {t('routing.deleteLastWarning')}
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
