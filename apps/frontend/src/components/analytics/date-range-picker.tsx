'use client';

import { useState, useCallback, memo } from 'react';
import { format, subDays, isAfter, differenceInDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import type { TimeRange } from '@/hooks/use-analytics';

interface DateRangeValue {
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}

const MAX_DAYS = 365;

export const DateRangePicker = memo<DateRangePickerProps>(
  ({ value, onChange, className }) => {
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState<string>(
      value.startDate || format(subDays(new Date(), 7), 'yyyy-MM-dd')
    );
    const [customEnd, setCustomEnd] = useState<string>(
      value.endDate || format(new Date(), 'yyyy-MM-dd')
    );
    const [error, setError] = useState<string | null>(null);

    const presetOptions: { value: TimeRange; label: string }[] = [
      { value: 'last_7_days', label: t('analytics.timeRange.last7Days') },
      { value: 'last_30_days', label: t('analytics.timeRange.last30Days') },
      { value: 'last_90_days', label: t('analytics.timeRange.last90Days') },
      { value: 'last_365_days', label: t('analytics.timeRange.last365Days') },
    ];

    const handlePresetClick = useCallback(
      (preset: TimeRange) => {
        onChange({ timeRange: preset });
      },
      [onChange]
    );

    const validateAndApply = useCallback(() => {
      const start = new Date(customStart);
      const end = new Date(customEnd);

      // Validate dates
      if (isAfter(start, end)) {
        setError(t('analytics.dateRange.errorStartAfterEnd'));
        return;
      }

      const daysDiff = differenceInDays(end, start);
      if (daysDiff > MAX_DAYS) {
        setError(t('analytics.dateRange.errorMaxDays', { days: MAX_DAYS }));
        return;
      }

      if (isAfter(end, new Date())) {
        setError(t('analytics.dateRange.errorFutureDate'));
        return;
      }

      setError(null);
      onChange({
        timeRange: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setOpen(false);
    }, [customStart, customEnd, onChange]);

    const getDisplayText = useCallback(() => {
      if (value.timeRange === 'custom' && value.startDate && value.endDate) {
        return `${value.startDate} ~ ${value.endDate}`;
      }
      const preset = presetOptions.find((p) => p.value === value.timeRange);
      return preset?.label || t('analytics.timeRange.last7Days');
    }, [value, presetOptions]);

    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {t('analytics.timeRangeLabel')}:
          </span>
          {presetOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePresetClick(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                value.timeRange === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {option.label}
            </button>
          ))}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={value.timeRange === 'custom' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                <CalendarIcon className="h-4 w-4" />
                {value.timeRange === 'custom'
                  ? getDisplayText()
                  : t('analytics.timeRange.custom')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {t('analytics.dateRange.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('analytics.dateRange.description', { days: MAX_DAYS })}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-date">
                      {t('analytics.dateRange.startDate')}
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStart}
                      onChange={(e) => {
                        setCustomStart(e.target.value);
                        setError(null);
                      }}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="end-date">
                      {t('analytics.dateRange.endDate')}
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEnd}
                      onChange={(e) => {
                        setCustomEnd(e.target.value);
                        setError(null);
                      }}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button onClick={validateAndApply} className="w-full">
                  {t('analytics.dateRange.apply')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';
