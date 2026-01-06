import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum TimeRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_365_DAYS = 'last_365_days',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Time range (last_7_days: Last 7 days, last_30_days: Last 30 days, last_90_days: Last 90 days, custom: Custom range)',
    enum: TimeRange,
    default: TimeRange.LAST_7_DAYS,
    example: 'last_7_days',
  })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange = TimeRange.LAST_7_DAYS;

  @ApiPropertyOptional({
    description: 'Custom start date (ISO 8601 format). Required when timeRange is custom.',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (ISO 8601 format). Required when timeRange is custom.',
    example: '2025-01-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
