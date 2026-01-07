/**
 * Geographic Distribution Component
 * Displays visitor location distribution in a compact format
 */

'use client';

import { memo, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';
import type { GeoLocationStat } from '@/hooks/use-analytics';

interface GeoDistributionProps {
  data: GeoLocationStat[];
  isLoading?: boolean;
}

// Country item component
const CountryItem = memo<{
  country: GeoLocationStat;
  maxPercentage: number;
}>(({ country, maxPercentage }) => {
  const barWidth = maxPercentage > 0 ? (country.percentage / maxPercentage) * 100 : 0;

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-sm w-20 truncate" title={country.name}>
        {country.name}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-full transition-all duration-300"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right">
        {formatNumber(country.clicks)} ({country.percentage.toFixed(1)}%)
      </span>
    </div>
  );
});
CountryItem.displayName = 'CountryItem';

// Loading skeleton
const GeoSkeleton = memo(() => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-2 py-1.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="flex-1 h-2" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
));
GeoSkeleton.displayName = 'GeoSkeleton';

// Empty state
const EmptyState = memo(() => (
  <div className="py-6 flex flex-col items-center justify-center text-center">
    <Globe className="h-10 w-10 text-muted-foreground/50 mb-2" />
    <p className="text-sm text-muted-foreground">{t('dashboard.noGeoData')}</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

export const GeoDistribution = memo<GeoDistributionProps>(
  ({ data, isLoading }) => {
    const topCountries = useMemo(() => data.slice(0, 5), [data]);
    const maxPercentage = useMemo(
      () => Math.max(...topCountries.map((c) => c.percentage), 1),
      [topCountries],
    );

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-base">
                {t('dashboard.geoDistribution')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.geoDistributionDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <GeoSkeleton />
          ) : topCountries.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {topCountries.map((country) => (
                <CountryItem
                  key={country.name}
                  country={country}
                  maxPercentage={maxPercentage}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
GeoDistribution.displayName = 'GeoDistribution';
