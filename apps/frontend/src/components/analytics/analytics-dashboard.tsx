/**
 * Analytics Dashboard Component
 * Optimized with React.memo, useMemo, and useCallback for better performance
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useUserAnalytics, useUserBotAnalytics, useUserAbTestAnalytics } from '@/hooks/use-analytics';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { formatNumber } from '@/lib/utils';
import { t } from '@/lib/i18n';
import type { TimeRange } from '@/types/api';

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'last_7_days', label: t('analytics.timeRange.last7Days') },
  { value: 'last_30_days', label: t('analytics.timeRange.last30Days') },
  { value: 'last_90_days', label: t('analytics.timeRange.last90Days') },
];

// Memoized StatCard component to prevent unnecessary re-renders
const StatCard = memo<{
  title: string;
  value: string | number;
  description: string;
  isPositive?: boolean;
}>(({ title, value, description, isPositive }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className={`text-3xl ${isPositive !== undefined ? (isPositive ? 'text-green-600' : 'text-red-600') : ''}`}>
        {value}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

// Memoized ProgressBar component
const ProgressBar = memo<{
  name: string;
  percentage: number;
  count?: number;
}>(({ name, percentage, count: _count }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{name}</span>
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {percentage.toFixed(1)}%
      </span>
    </div>
  </div>
));
ProgressBar.displayName = 'ProgressBar';

// Memoized UTMProgressBar component with truncated text
const UTMProgressBar = memo<{
  value: string;
  percentage: number;
}>(({ value, percentage }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium truncate max-w-[120px]">
      {value}
    </span>
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {percentage.toFixed(1)}%
      </span>
    </div>
  </div>
));
UTMProgressBar.displayName = 'UTMProgressBar';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('last_7_days');
  const { data, isLoading, error } = useUserAnalytics({ timeRange });
  const { data: botData, isLoading: botLoading } = useUserBotAnalytics({ timeRange });
  const { data: abTestData, isLoading: abTestLoading } = useUserAbTestAnalytics({ timeRange });

  // Memoize the time range change handler
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  // Memoize computed values (must be called unconditionally)
  const overviewStats = useMemo(() => {
    if (!data) return [];
    const { overview } = data;
    return [
      {
        title: t('analytics.stats.totalClicks'),
        value: formatNumber(overview.totalClicks),
        description: `${overview.growthRate >= 0 ? '+' : ''}${overview.growthRate.toFixed(1)}% ${t('analytics.stats.comparedToPrevious')}`,
      },
      {
        title: t('analytics.stats.uniqueVisitors'),
        value: formatNumber(overview.uniqueVisitors),
        description: t('analytics.stats.uniqueIPs'),
      },
      {
        title: t('analytics.stats.averageClicksPerDay'),
        value: overview.averageClicksPerDay.toFixed(1),
        description: t('analytics.stats.dailyAverage'),
      },
      {
        title: t('analytics.stats.growthRate'),
        value: `${overview.growthRate >= 0 ? '+' : ''}${overview.growthRate.toFixed(1)}%`,
        description: t('analytics.stats.comparedToPrevious'),
        isPositive: overview.growthRate >= 0,
      },
    ];
  }, [data]);

  // Memoize top items to avoid recalculation
  const topBrowsers = useMemo(() => data?.browsers.slice(0, 5) || [], [data]);
  const topOS = useMemo(() => data?.operatingSystems.slice(0, 5) || [], [data]);
  const topDevices = useMemo(() => data?.devices.slice(0, 5) || [], [data]);
  const topCountries = useMemo(() => data?.countries.slice(0, 10) || [], [data]);
  const topUTMSources = useMemo(() => data?.utmSources.slice(0, 5) || [], [data]);
  const topUTMMediums = useMemo(() => data?.utmMediums.slice(0, 5) || [], [data]);
  const topUTMCampaigns = useMemo(() => data?.utmCampaigns.slice(0, 5) || [], [data]);

  // Check if UTM data exists
  const hasUTMData = useMemo(
    () => (data?.utmSources.length || 0) > 0 || (data?.utmMediums.length || 0) > 0 || (data?.utmCampaigns.length || 0) > 0,
    [data]
  );

  // Handle loading and error states after all hooks
  if (isLoading) {
    return <Loading text={t('analytics.loadingData')} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            {t('analytics.loadFailed')}: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {t('analytics.timeRangeLabel')}:
        </span>
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleTimeRangeChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              timeRange === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            isPositive={stat.isPositive}
          />
        ))}
      </div>

      {/* Device Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.browsers.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topBrowsers.map((browser) => (
                <ProgressBar
                  key={browser.name}
                  name={browser.name}
                  percentage={browser.percentage}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operating Systems */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.os.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topOS.map((os) => (
                <ProgressBar
                  key={os.name}
                  name={os.name}
                  percentage={os.percentage}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.devices.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topDevices.map((device) => (
                <ProgressBar
                  key={device.name}
                  name={device.name}
                  percentage={device.percentage}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.geo.title')}</CardTitle>
          <CardDescription>{t('analytics.geo.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {topCountries.map((country) => (
              <div
                key={country.name}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-medium">{country.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(country.clicks)} {t('analytics.geo.clicks')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({country.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bot Traffic Statistics */}
      {!botLoading && botData && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Bot Clicks */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('bots.totalBotClicks')}</CardDescription>
              <CardTitle className="text-3xl">
                {formatNumber(botData.totalBotClicks)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {t('bots.botPercentage', { percentage: botData.botPercentage.toFixed(1) })}
              </p>
            </CardContent>
          </Card>

          {/* Bot Types Distribution */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('bots.botTypesTitle')}</CardTitle>
              <CardDescription>
                {botData.botTypes.length > 0
                  ? t('bots.topBots', { count: Math.min(5, botData.botTypes.length) })
                  : t('bots.noData')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {botData.botTypes.length > 0 ? (
                <div className="space-y-2">
                  {botData.botTypes.slice(0, 5).map((bot) => (
                    <ProgressBar
                      key={bot.botName}
                      name={bot.botName}
                      percentage={bot.percentage}
                      count={bot.clicks}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('bots.noDataDesc')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* UTM Parameters Statistics */}
      {hasUTMData && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* UTM Sources */}
          {data.utmSources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.utm.utmSources')}</CardTitle>
                <CardDescription>
                  {t('analytics.utm.utmSourcesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topUTMSources.map((source) => (
                    <UTMProgressBar
                      key={source.value}
                      value={source.value}
                      percentage={source.percentage}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* UTM Mediums */}
          {data.utmMediums.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.utm.utmMediums')}</CardTitle>
                <CardDescription>
                  {t('analytics.utm.utmMediumsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topUTMMediums.map((medium) => (
                    <UTMProgressBar
                      key={medium.value}
                      value={medium.value}
                      percentage={medium.percentage}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* UTM Campaigns */}
          {data.utmCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.utm.utmCampaigns')}</CardTitle>
                <CardDescription>
                  {t('analytics.utm.utmCampaignsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topUTMCampaigns.map((campaign) => (
                    <UTMProgressBar
                      key={campaign.value}
                      value={campaign.value}
                      percentage={campaign.percentage}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* A/B Testing Statistics */}
      {!abTestLoading && abTestData && abTestData.totalAbTestUrls > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('abTests.title')}</h3>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Total A/B Test URLs */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('abTests.totalUrls')}</CardDescription>
                <CardTitle className="text-3xl">
                  {t('abTests.totalUrlsCount', { count: abTestData.totalAbTestUrls })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('abTests.totalTestClicks')}: {formatNumber(abTestData.totalTestClicks)}
                </p>
              </CardContent>
            </Card>

            {/* Control Group vs Variants */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('abTests.controlGroupClicks')}</CardDescription>
                <CardTitle className="text-3xl">
                  {formatNumber(abTestData.controlGroupClicks)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('abTests.controlGroupPercentage', { percentage: abTestData.controlGroupPercentage.toFixed(1) })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('abTests.variantClicks')}</CardDescription>
                <CardTitle className="text-3xl">
                  {formatNumber(abTestData.variantClicks)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('abTests.variantPercentage', { percentage: abTestData.variantPercentage.toFixed(1) })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Variants */}
          {abTestData.topPerformingVariants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('abTests.topPerformingVariants')}</CardTitle>
                <CardDescription>
                  {t('abTests.topVariants', { count: Math.min(10, abTestData.topPerformingVariants.length) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {abTestData.topPerformingVariants.slice(0, 10).map((variant) => (
                    <div key={`${variant.urlSlug}-${variant.variantName}`} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{variant.variantName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          /{variant.urlSlug}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatNumber(variant.clicks)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('abTests.clickRate')}: {variant.clickThroughRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
