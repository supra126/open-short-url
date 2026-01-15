/**
 * Dashboard Page
 * Main dashboard with analytics overview, recent URLs, and quick actions
 */

'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserAnalytics, type TimeRange } from '@/hooks/use-analytics';
import { useRecentUrls } from '@/hooks/use-dashboard';
import { useUrls, type UrlResponseDto } from '@/hooks/use-url';
import {
  ClickTrendChart,
  RecentUrls,
  TopPerformingUrls,
  GeoDistribution,
} from '@/components/dashboard';
import {
  TrendingUp,
  TrendingDown,
  Link as LinkIcon,
  BarChart3,
  Plus,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';

// Memoized stat card with skeleton support
const StatCard = memo<{
  title: string;
  value: string | number;
  description: string;
  isLoading?: boolean;
  trend?: number;
}>(({ title, value, description, isLoading, trend }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      {isLoading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <CardTitle className="text-3xl">{value}</CardTitle>
      )}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-4 w-32" />
      ) : trend !== undefined ? (
        <div className="flex items-center text-xs text-muted-foreground">
          {trend > 0 ? (
            <>
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              <span className="text-success">+{trend.toFixed(1)}%</span>
              <span className="ml-1">{t('dashboard.growthRate')}</span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
              <span className="text-destructive">{trend.toFixed(1)}%</span>
              <span className="ml-1">{t('dashboard.growthRate')}</span>
            </>
          ) : (
            t('dashboard.noChange')
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

// Onboarding card for new users
const OnboardingCard = memo(() => (
  <Card className="border-dashed border-2 bg-muted/30">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {t('dashboard.onboarding.title')}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t('dashboard.onboarding.description')}
      </p>
      <div className="flex gap-4 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            1
          </span>
          {t('dashboard.onboarding.step1')}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            2
          </span>
          {t('dashboard.onboarding.step2')}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            3
          </span>
          {t('dashboard.onboarding.step3')}
        </div>
      </div>
      <Button size="lg" asChild className="whitespace-nowrap">
        <Link href="/urls/new" className="inline-flex items-center">
          <Plus className="mr-2 h-4 w-4 shrink-0" />
          {t('dashboard.createFirstUrl')}
        </Link>
      </Button>
    </CardContent>
  </Card>
));
OnboardingCard.displayName = 'OnboardingCard';

// Quick action button
const QuickActionButton = memo<{
  href: string;
  icon: React.ReactNode;
  label: string;
}>(({ href, icon, label }) => (
  <Link href={href}>
    <Button variant="outline" className="w-full h-16 flex flex-row gap-3 justify-start px-4">
      <span className="text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </Button>
  </Link>
));
QuickActionButton.displayName = 'QuickActionButton';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('last_7_days');
  const [isRefetching, setIsRefetching] = useState(false);
  const { toast } = useToast();

  // Fetch analytics data
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useUserAnalytics({ timeRange });

  // Fetch recent URLs
  const { data: recentUrls, isLoading: isLoadingRecentUrls } = useRecentUrls(5);

  // Fetch URL list for stats and top performing
  const { data: urlsData, isLoading: isLoadingUrls } = useUrls({
    pageSize: 100,
    sortBy: 'clickCount',
    sortOrder: 'desc',
  });

  // Handle time range change
  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
  }, []);

  // Handle analytics refresh with error handling
  const handleRefreshAnalytics = useCallback(async () => {
    if (isRefetching) return;

    setIsRefetching(true);
    try {
      await refetchAnalytics();
      toast({
        title: t('common.success'),
        description: t('dashboard.refreshSuccess'),
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('dashboard.refreshFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsRefetching(false);
    }
  }, [isRefetching, refetchAnalytics, toast]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUrls = urlsData?.total || 0;
    const activeUrls =
      urlsData?.data.filter((url: UrlResponseDto) => url.status === 'ACTIVE')
        .length || 0;
    const totalClicks = analytics?.overview.totalClicks || 0;
    const averageClicksPerDay = analytics?.overview.averageClicksPerDay || 0;
    const growthRate = analytics?.overview.growthRate || 0;

    return {
      totalUrls,
      activeUrls,
      totalClicks,
      averageClicksPerDay,
      growthRate,
    };
  }, [urlsData, analytics]);

  // Get time series data for chart
  const timeSeriesData = useMemo(
    () => analytics?.timeSeries || [],
    [analytics],
  );

  // Get top countries for geo distribution
  const topCountries = useMemo(
    () => analytics?.countries || [],
    [analytics],
  );

  // Get top performing URLs
  const topPerformingUrls = useMemo(
    () => urlsData?.data.slice(0, 5) || [],
    [urlsData],
  );

  const isLoading = isLoadingAnalytics || isLoadingUrls;
  const isNewUser = !isLoading && stats.totalUrls === 0;

  // Time range options
  const timeRangeOptions = [
    { value: 'last_7_days', label: t('analytics.timeRange.last7Days') },
    { value: 'last_30_days', label: t('analytics.timeRange.last30Days') },
    { value: 'last_90_days', label: t('analytics.timeRange.last90Days') },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('dashboard.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" asChild className="whitespace-nowrap">
            <Link href="/urls/new" className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              {t('dashboard.createUrl')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {analyticsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{analyticsError.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAnalytics}
              disabled={isRefetching}
            >
              {isRefetching ? t('common.loading') : t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* New User Onboarding */}
      {isNewUser ? (
        <OnboardingCard />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('dashboard.totalUrls')}
              value={formatNumber(stats.totalUrls)}
              description={`${stats.activeUrls} ${t('dashboard.activeCount')}`}
              isLoading={isLoadingUrls}
            />
            <StatCard
              title={t('dashboard.totalClicks')}
              value={formatNumber(stats.totalClicks)}
              description=""
              isLoading={isLoadingAnalytics}
              trend={stats.growthRate}
            />
            <StatCard
              title={t('dashboard.averageClicksPerDay')}
              value={formatNumber(Math.round(stats.averageClicksPerDay))}
              description={
                timeRange === 'last_7_days'
                  ? t('dashboard.last7Days')
                  : t('dashboard.last30Days')
              }
              isLoading={isLoadingAnalytics}
            />
            <StatCard
              title={t('dashboard.activeUrls')}
              value={formatNumber(stats.activeUrls)}
              description={
                stats.totalUrls > 0
                  ? `${((stats.activeUrls / stats.totalUrls) * 100).toFixed(1)}% ${t('dashboard.activationRate')}`
                  : t('dashboard.noUrls')
              }
              isLoading={isLoadingUrls}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Click Trend Chart */}
              <ClickTrendChart
                data={timeSeriesData}
                isLoading={isLoadingAnalytics}
              />

              {/* Top Performing URLs */}
              <TopPerformingUrls
                urls={topPerformingUrls}
                isLoading={isLoadingUrls}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Recent URLs */}
              <RecentUrls
                urls={recentUrls || []}
                isLoading={isLoadingRecentUrls}
              />

              {/* Geographic Distribution */}
              <GeoDistribution
                data={topCountries}
                isLoading={isLoadingAnalytics}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dashboard.quickActions')}</CardTitle>
              <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <QuickActionButton
                href="/urls/new"
                icon={<LinkIcon className="h-5 w-5" />}
                label={t('dashboard.createUrl')}
              />
              <QuickActionButton
                href="/urls"
                icon="📋"
                label={t('dashboard.manageUrls')}
              />
              <QuickActionButton
                href="/analytics"
                icon={<BarChart3 className="h-5 w-5" />}
                label={t('dashboard.viewAnalytics')}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
