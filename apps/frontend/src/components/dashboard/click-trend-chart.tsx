/**
 * Click Trend Chart Component
 * Displays a simple bar chart for click trends over time
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
import { t } from '@/lib/i18n';
import { formatShortDate } from '@/lib/utils';
import type { TimeSeriesDataPoint } from '@/hooks/use-dashboard';

interface ClickTrendChartProps {
  data: TimeSeriesDataPoint[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

// Memoized bar component
const TrendBar = memo<{
  date: string;
  clicks: number;
  maxClicks: number;
  index: number;
}>(({ date, clicks, maxClicks, index }) => {
  const height = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
  const formattedDate = formatShortDate(date);

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="relative w-full h-24 flex items-end justify-center">
        <div
          className="w-full max-w-6 bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
          style={{ height: `${Math.max(height, 4)}%` }}
          title={`${formattedDate}: ${clicks} ${t('common.clicks')}`}
        />
      </div>
      {index % 2 === 0 && (
        <span className="text-[10px] text-muted-foreground truncate max-w-full">
          {formattedDate}
        </span>
      )}
    </div>
  );
});
TrendBar.displayName = 'TrendBar';

// Static heights for skeleton to avoid hydration mismatch
const SKELETON_HEIGHTS = [45, 70, 55, 80, 35, 65, 50];

// Loading skeleton
const ChartSkeleton = memo(() => (
  <div className="flex items-end gap-1 h-24">
    {SKELETON_HEIGHTS.map((height, i) => (
      <Skeleton
        key={i}
        className="flex-1 min-w-0"
        style={{ height: `${height}%` }}
      />
    ))}
  </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

export const ClickTrendChart = memo<ClickTrendChartProps>(
  ({ data, isLoading, title, description }) => {
    const maxClicks = useMemo(
      () => Math.max(...data.map((d) => d.clicks), 1),
      [data],
    );

    const totalClicks = useMemo(
      () => data.reduce((sum, d) => sum + d.clicks, 0),
      [data],
    );

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {title || t('dashboard.clickTrend')}
          </CardTitle>
          <CardDescription>
            {description || t('dashboard.clickTrendDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
          ) : data.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
              {t('dashboard.noClickData')}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-1">
                {data.map((point, index) => (
                  <TrendBar
                    key={point.date}
                    date={point.date}
                    clicks={point.clicks}
                    maxClicks={maxClicks}
                    index={index}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {t('dashboard.totalClicksInPeriod', { count: totalClicks })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
ClickTrendChart.displayName = 'ClickTrendChart';
