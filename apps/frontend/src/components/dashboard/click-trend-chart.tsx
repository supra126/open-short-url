/**
 * Click Trend Chart Component
 * Displays an area chart for click trends over time using Recharts
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ClickTrendChartProps {
  data: TimeSeriesDataPoint[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

// Custom tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {payload[0].value.toLocaleString()} {t('common.clicks')}
      </p>
    </div>
  );
}

// Loading skeleton
const ChartSkeleton = memo(() => (
  <div className="h-[200px] w-full flex items-end gap-1 px-4">
    {[45, 70, 55, 80, 35, 65, 50].map((height, i) => (
      <Skeleton
        key={i}
        className="flex-1 min-w-0 rounded-t"
        style={{ height: `${height}%` }}
      />
    ))}
  </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

export const ClickTrendChart = memo<ClickTrendChartProps>(
  ({ data, isLoading, title, description }) => {
    const chartData = useMemo(
      () =>
        data.map((d) => ({
          ...d,
          formattedDate: formatShortDate(d.date),
        })),
      [data],
    );

    const totalClicks = useMemo(
      () => data.reduce((sum, d) => sum + d.clicks, 0),
      [data],
    );

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-display">
                {title || t('dashboard.clickTrend')}
              </CardTitle>
              <CardDescription>
                {description || t('dashboard.clickTrendDesc')}
              </CardDescription>
            </div>
            {!isLoading && data.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {t('dashboard.totalClicksInPeriod', { count: totalClicks })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
          ) : data.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              {t('dashboard.noClickData')}
            </div>
          ) : (
            <div className="h-[200px] w-full" role="img" aria-label={t('dashboard.clickTrend')}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#clickGradient)"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
ClickTrendChart.displayName = 'ClickTrendChart';
