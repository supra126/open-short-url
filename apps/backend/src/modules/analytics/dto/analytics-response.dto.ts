import { ApiProperty } from '@nestjs/swagger';

// Time series data point
export class TimeSeriesDataPoint {
  @ApiProperty({ description: 'Date', example: '2025-01-15' })
  date!: string;

  @ApiProperty({ description: 'Number of clicks', example: 42 })
  clicks!: number;
}

// Geographic location statistics
export class GeoLocationStat {
  @ApiProperty({ description: 'Country/Region/City name', example: 'Taiwan' })
  name!: string;

  @ApiProperty({ description: 'Number of clicks', example: 123 })
  clicks!: number;

  @ApiProperty({ description: 'Percentage', example: 45.5 })
  percentage!: number;
}

// Device/Browser/Operating System statistics
export class DeviceStat {
  @ApiProperty({ description: 'Name', example: 'Chrome' })
  name!: string;

  @ApiProperty({ description: 'Number of clicks', example: 85 })
  clicks!: number;

  @ApiProperty({ description: 'Percentage', example: 62.3 })
  percentage!: number;
}

// Referer statistics
export class RefererStat {
  @ApiProperty({ description: 'Referer URL', example: 'https://google.com' })
  referer!: string;

  @ApiProperty({ description: 'Number of clicks', example: 50 })
  clicks!: number;

  @ApiProperty({ description: 'Percentage', example: 35.2 })
  percentage!: number;
}

// UTM parameter statistics
export class UtmStat {
  @ApiProperty({ description: 'UTM parameter value', example: 'newsletter' })
  value!: string;

  @ApiProperty({ description: 'Number of clicks', example: 30 })
  clicks!: number;

  @ApiProperty({ description: 'Percentage', example: 21.4 })
  percentage!: number;
}

// Overview statistics
export class OverviewStats {
  @ApiProperty({ description: 'Total number of clicks', example: 1250 })
  totalClicks!: number;

  @ApiProperty({ description: 'Number of unique visitors', example: 850 })
  uniqueVisitors!: number;

  @ApiProperty({ description: 'Average clicks per day', example: 12.5 })
  averageClicksPerDay!: number;

  @ApiProperty({ description: 'Growth rate compared to previous period (%)', example: 15.3 })
  growthRate!: number;
}

// Complete analytics report
export class AnalyticsResponseDto {
  @ApiProperty({ description: 'Overview statistics', type: OverviewStats })
  overview!: OverviewStats;

  @ApiProperty({
    description: 'Time series data (click trends)',
    type: [TimeSeriesDataPoint],
  })
  timeSeries!: TimeSeriesDataPoint[];

  @ApiProperty({
    description: 'Country distribution',
    type: [GeoLocationStat],
  })
  countries!: GeoLocationStat[];

  @ApiProperty({
    description: 'Region distribution',
    type: [GeoLocationStat],
  })
  regions!: GeoLocationStat[];

  @ApiProperty({
    description: 'City distribution',
    type: [GeoLocationStat],
  })
  cities!: GeoLocationStat[];

  @ApiProperty({
    description: 'Browser distribution',
    type: [DeviceStat],
  })
  browsers!: DeviceStat[];

  @ApiProperty({
    description: 'Operating system distribution',
    type: [DeviceStat],
  })
  operatingSystems!: DeviceStat[];

  @ApiProperty({
    description: 'Device type distribution',
    type: [DeviceStat],
  })
  devices!: DeviceStat[];

  @ApiProperty({
    description: 'Referer sources',
    type: [RefererStat],
  })
  referers!: RefererStat[];

  @ApiProperty({
    description: 'UTM Source statistics',
    type: [UtmStat],
  })
  utmSources!: UtmStat[];

  @ApiProperty({
    description: 'UTM Medium statistics',
    type: [UtmStat],
  })
  utmMediums!: UtmStat[];

  @ApiProperty({
    description: 'UTM Campaign statistics',
    type: [UtmStat],
  })
  utmCampaigns!: UtmStat[];
}

// Recent click record
export class RecentClickDto {
  @ApiProperty({ description: 'Click ID', example: 'clxxx987654321' })
  id!: string;

  @ApiProperty({ description: 'IP address', example: '192.168.1.1', required: false })
  ip?: string;

  @ApiProperty({ description: 'Browser', example: 'Chrome', required: false })
  browser?: string;

  @ApiProperty({ description: 'Operating system', example: 'Windows', required: false })
  os?: string;

  @ApiProperty({ description: 'Device type', example: 'Desktop', required: false })
  device?: string;

  @ApiProperty({ description: 'Country', example: 'Taiwan', required: false })
  country?: string;

  @ApiProperty({ description: 'City', example: 'Taipei', required: false })
  city?: string;

  @ApiProperty({ description: 'Referer URL', example: 'https://google.com', required: false })
  referer?: string;

  @ApiProperty({ description: 'UTM Source', example: 'newsletter', required: false })
  utmSource?: string;

  @ApiProperty({ description: 'UTM Medium', example: 'email', required: false })
  utmMedium?: string;

  @ApiProperty({ description: 'UTM Campaign', example: 'summer_sale', required: false })
  utmCampaign?: string;

  @ApiProperty({ description: 'Is this click from a bot', example: false })
  isBot!: boolean;

  @ApiProperty({ description: 'Bot name if detected', example: 'Googlebot', required: false })
  botName?: string;

  @ApiProperty({ description: 'Click timestamp', example: '2025-01-15T10:30:00Z' })
  createdAt!: Date;
}

// Recent clicks list response
export class RecentClicksResponseDto {
  @ApiProperty({
    description: 'Recent click records',
    type: [RecentClickDto],
  })
  clicks!: RecentClickDto[];

  @ApiProperty({ description: 'Total number of clicks', example: 250 })
  total!: number;
}
