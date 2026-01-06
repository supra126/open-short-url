'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserAnalytics } from '@/hooks/use-analytics';
import { useUrls, type UrlResponseDto } from '@/hooks/use-url';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function DashboardPage() {
  // Fetch analytics data
  const { data: analytics, isLoading: isLoadingAnalytics } = useUserAnalytics({
    timeRange: 'last_30_days',
  });

  // Fetch URL list data
  const { data: urlsData, isLoading: isLoadingUrls } = useUrls({
    pageSize: 100, // Fetch first page data (total field contains the total count)
  });

  // Calculate statistics
  const totalUrls = urlsData?.total || 0;
  const activeUrls =
    urlsData?.data.filter((url: UrlResponseDto) => url.status === 'ACTIVE').length || 0;
  const totalClicks = analytics?.overview.totalClicks || 0;
  const averageClicksPerDay = analytics?.overview.averageClicksPerDay || 0;
  const growthRate = analytics?.overview.growthRate || 0;

  const isLoading = isLoadingAnalytics || isLoadingUrls;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
        </div>
        <Link href="/urls/new">
          <Button size="lg">➕ {t('dashboard.createUrl')}</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.totalUrls')}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                totalUrls.toLocaleString()
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? t('dashboard.loading')
                : `${activeUrls} ${t('dashboard.activeCount')}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.totalClicks')}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                totalClicks.toLocaleString()
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              {isLoading ? (
                t('dashboard.loading')
              ) : growthRate > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">
                    +{growthRate.toFixed(1)}%
                  </span>
                  <span className="ml-1">{t('dashboard.growthRate')}</span>
                </>
              ) : growthRate < 0 ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">{growthRate.toFixed(1)}%</span>
                  <span className="ml-1">{t('dashboard.growthRate')}</span>
                </>
              ) : (
                t('dashboard.noChange')
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {t('dashboard.averageClicksPerDay')}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                Math.round(averageClicksPerDay).toLocaleString()
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading ? t('dashboard.loading') : t('dashboard.last30Days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.activeUrls')}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                activeUrls.toLocaleString()
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? t('dashboard.loading')
                : totalUrls > 0
                  ? `${((activeUrls / totalUrls) * 100).toFixed(1)}% ${t('dashboard.activationRate')}`
                  : t('dashboard.noUrls')}
            </p>
          </CardContent>
        </Card>
        </div>

        {/* Quick Actions */}
        <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/urls/new">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2"
            >
              <span className="text-2xl">🔗</span>
              <span>{t('dashboard.createUrl')}</span>
            </Button>
          </Link>
          <Link href="/urls">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2"
            >
              <span className="text-2xl">📋</span>
              <span>{t('dashboard.manageUrls')}</span>
            </Button>
          </Link>
          <Link href="/analytics">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2"
            >
              <span className="text-2xl">📊</span>
              <span>{t('dashboard.viewAnalytics')}</span>
            </Button>
          </Link>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
