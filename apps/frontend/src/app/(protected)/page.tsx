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
import { useCurrentUser } from '@/hooks/use-auth';
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
  MousePointerClick,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';

// Color variants for stat cards
const statColors = [
  { icon: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
  { icon: 'text-info', bg: 'bg-info/10', border: 'border-l-info' },
  { icon: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' },
  { icon: 'text-success', bg: 'bg-success/10', border: 'border-l-success' },
];

const StatCard = memo<{
  title: string;
  value: string | number;
  description: string;
  isLoading?: boolean;
  trend?: number;
  icon: React.ReactNode;
  colorIndex: number;
  delay: number;
}>(({ title, value, description, isLoading, trend, icon, colorIndex, delay }) => {
  const color = statColors[colorIndex % statColors.length];
  return (
    <Card
      className={`border-l-4 ${color.border} opacity-0 animate-slide-up hover:shadow-md hover:-translate-y-0.5`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="font-medium">{title}</CardDescription>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color.bg}`}>
            <span className={color.icon}>{icon}</span>
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <CardTitle className="text-3xl font-display">{value}</CardTitle>
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
                <span className="text-success font-medium">+{trend.toFixed(1)}%</span>
                <span className="ml-1">{t('dashboard.growthRate')}</span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
                <span className="text-destructive font-medium">{trend.toFixed(1)}%</span>
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
  );
});
StatCard.displayName = 'StatCard';

// Onboarding card for new users
const OnboardingCard = memo(() => (
  <Card className="border-dashed border-2 bg-muted/30 opacity-0 animate-scale-in" style={{ animationDelay: '100ms' }}>
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-display font-semibold mb-2">
        {t('dashboard.onboarding.title')}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t('dashboard.onboarding.description')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            1
          </span>
          {t('dashboard.onboarding.step1')}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            2
          </span>
          {t('dashboard.onboarding.step2')}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
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

// Quick action card
const QuickActionCard = memo<{
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  delay: number;
}>(({ href, icon, label, description, delay }) => (
  <Link href={href}>
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-primary/30 opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
));
QuickActionCard.displayName = 'QuickActionCard';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('last_7_days');
  const [isRefetching, setIsRefetching] = useState(false);
  const { toast } = useToast();
  const { data: user } = useCurrentUser();

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

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.name || user?.email?.split('@')[0] || '';
    const nameStr = name ? `, ${name}` : '';
    if (hour < 12) return `${t('dashboard.greetingMorning')}${nameStr}`;
    if (hour < 18) return `${t('dashboard.greetingAfternoon')}${nameStr}`;
    return `${t('dashboard.greetingEvening')}${nameStr}`;
  }, [user]);

  // Time range options
  const timeRangeOptions = [
    { value: 'last_7_days', label: t('analytics.timeRange.last7Days') },
    { value: 'last_30_days', label: t('analytics.timeRange.last30Days') },
    { value: 'last_90_days', label: t('analytics.timeRange.last90Days') },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 opacity-0 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">{greeting}</h1>
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
              icon={<LinkIcon className="h-4 w-4" />}
              colorIndex={0}
              delay={50}
            />
            <StatCard
              title={t('dashboard.totalClicks')}
              value={formatNumber(stats.totalClicks)}
              description=""
              isLoading={isLoadingAnalytics}
              trend={stats.growthRate}
              icon={<MousePointerClick className="h-4 w-4" />}
              colorIndex={1}
              delay={100}
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
              icon={<Activity className="h-4 w-4" />}
              colorIndex={2}
              delay={150}
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
              icon={<CheckCircle2 className="h-4 w-4" />}
              colorIndex={3}
              delay={200}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <ClickTrendChart
                data={timeSeriesData}
                isLoading={isLoadingAnalytics}
              />
              <TopPerformingUrls
                urls={topPerformingUrls}
                isLoading={isLoadingUrls}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <RecentUrls
                urls={recentUrls || []}
                isLoading={isLoadingRecentUrls}
              />
              <GeoDistribution
                data={topCountries}
                isLoading={isLoadingAnalytics}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-display font-semibold mb-3">{t('dashboard.quickActions')}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickActionCard
                href="/urls/new"
                icon={<LinkIcon className="h-5 w-5" />}
                label={t('dashboard.createUrl')}
                description={t('dashboard.quickActionCreateDesc')}
                delay={300}
              />
              <QuickActionCard
                href="/urls"
                icon={<CheckCircle2 className="h-5 w-5" />}
                label={t('dashboard.manageUrls')}
                description={t('dashboard.quickActionManageDesc')}
                delay={350}
              />
              <QuickActionCard
                href="/analytics"
                icon={<BarChart3 className="h-5 w-5" />}
                label={t('dashboard.viewAnalytics')}
                description={t('dashboard.quickActionAnalyticsDesc')}
                delay={400}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
