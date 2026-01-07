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

  @ApiProperty({ description: 'A/B Testing variant ID', example: 'clxxx111222333', required: false })
  variantId?: string;

  @ApiProperty({ description: 'Routing rule ID that matched', example: 'clxxx444555666', required: false })
  routingRuleId?: string;

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

  @ApiProperty({ description: 'Region/State', example: 'Taipei City', required: false })
  region?: string;

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

  @ApiProperty({ description: 'UTM Term', example: 'discount', required: false })
  utmTerm?: string;

  @ApiProperty({ description: 'UTM Content', example: 'banner_ad', required: false })
  utmContent?: string;

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

// Bot type statistics
export class BotTypeStat {
  @ApiProperty({ description: 'Bot name', example: 'Googlebot' })
  botName!: string;

  @ApiProperty({ description: 'Number of clicks', example: 45 })
  clicks!: number;

  @ApiProperty({ description: 'Percentage', example: 35.2 })
  percentage!: number;
}

// Bot analytics response for a single URL
export class BotAnalyticsResponseDto {
  @ApiProperty({ description: 'Total bot clicks', example: 128 })
  totalBotClicks!: number;

  @ApiProperty({
    description: 'Bot type distribution (Top 10)',
    type: [BotTypeStat],
  })
  botTypes!: BotTypeStat[];
}

// Bot analytics response for all user URLs
export class UserBotAnalyticsResponseDto {
  @ApiProperty({ description: 'Total bot clicks', example: 256 })
  totalBotClicks!: number;

  @ApiProperty({ description: 'Bot traffic percentage', example: 12.5 })
  botPercentage!: number;

  @ApiProperty({
    description: 'Bot type distribution (Top 10)',
    type: [BotTypeStat],
  })
  botTypes!: BotTypeStat[];
}

// Top performing variant statistics
export class TopPerformingVariant {
  @ApiProperty({ description: 'URL slug', example: 'abc123' })
  urlSlug!: string;

  @ApiProperty({ description: 'Variant name', example: 'Variant A' })
  variantName!: string;

  @ApiProperty({ description: 'Number of clicks', example: 150 })
  clicks!: number;

  @ApiProperty({ description: 'Click-through rate (%)', example: 45.5 })
  clickThroughRate!: number;
}

// A/B Testing analytics response
export class AbTestAnalyticsResponseDto {
  @ApiProperty({ description: 'Total number of URLs with A/B testing enabled', example: 5 })
  totalAbTestUrls!: number;

  @ApiProperty({ description: 'Total clicks on A/B test URLs', example: 500 })
  totalTestClicks!: number;

  @ApiProperty({ description: 'Control group clicks', example: 250 })
  controlGroupClicks!: number;

  @ApiProperty({ description: 'Variant clicks', example: 250 })
  variantClicks!: number;

  @ApiProperty({ description: 'Control group percentage', example: 50.0 })
  controlGroupPercentage!: number;

  @ApiProperty({ description: 'Variant percentage', example: 50.0 })
  variantPercentage!: number;

  @ApiProperty({
    description: 'Top performing variants',
    type: [TopPerformingVariant],
  })
  topPerformingVariants!: TopPerformingVariant[];
}

// Routing rule statistics
export class RoutingRuleStat {
  @ApiProperty({ description: 'Rule ID', example: 'clxxx123456789' })
  ruleId!: string;

  @ApiProperty({ description: 'Rule name', example: 'iOS Users' })
  ruleName!: string;

  @ApiProperty({ description: 'Target URL', example: 'https://apps.apple.com/app/myapp' })
  targetUrl!: string;

  @ApiProperty({ description: 'Number of matches', example: 150 })
  matchCount!: number;

  @ApiProperty({ description: 'Match percentage', example: 35.5 })
  matchPercentage!: number;

  @ApiProperty({ description: 'Is rule active', example: true })
  isActive!: boolean;
}

// Routing rule time series data point
export class RoutingRuleTimeSeriesDataPoint {
  @ApiProperty({ description: 'Date', example: '2025-01-15' })
  date!: string;

  @ApiProperty({ description: 'Rule ID', example: 'clxxx123456789' })
  ruleId!: string;

  @ApiProperty({ description: 'Rule name', example: 'iOS Users' })
  ruleName!: string;

  @ApiProperty({ description: 'Number of matches', example: 42 })
  matches!: number;
}

// Routing rule geographic distribution
export class RoutingRuleGeoStat {
  @ApiProperty({ description: 'Rule ID', example: 'clxxx123456789' })
  ruleId!: string;

  @ApiProperty({ description: 'Rule name', example: 'iOS Users' })
  ruleName!: string;

  @ApiProperty({ description: 'Country', example: 'Taiwan' })
  country!: string;

  @ApiProperty({ description: 'Number of matches', example: 85 })
  matches!: number;

  @ApiProperty({ description: 'Percentage of rule matches', example: 56.7 })
  percentage!: number;
}

// Routing rule device distribution
export class RoutingRuleDeviceStat {
  @ApiProperty({ description: 'Rule ID', example: 'clxxx123456789' })
  ruleId!: string;

  @ApiProperty({ description: 'Rule name', example: 'iOS Users' })
  ruleName!: string;

  @ApiProperty({ description: 'Device type', example: 'Mobile' })
  device!: string;

  @ApiProperty({ description: 'Number of matches', example: 120 })
  matches!: number;

  @ApiProperty({ description: 'Percentage of rule matches', example: 80.0 })
  percentage!: number;
}

// Routing analytics response for a URL
export class RoutingAnalyticsResponseDto {
  @ApiProperty({ description: 'URL ID', example: 'clxxx987654321' })
  urlId!: string;

  @ApiProperty({ description: 'Is smart routing enabled', example: true })
  isSmartRouting!: boolean;

  @ApiProperty({ description: 'Total routing matches', example: 423 })
  totalMatches!: number;

  @ApiProperty({ description: 'Total clicks (including non-matches)', example: 1250 })
  totalClicks!: number;

  @ApiProperty({ description: 'Routing match rate (%)', example: 33.8 })
  matchRate!: number;

  @ApiProperty({
    description: 'Rule statistics',
    type: [RoutingRuleStat],
  })
  rules!: RoutingRuleStat[];

  @ApiProperty({
    description: 'Time series data by rule',
    type: [RoutingRuleTimeSeriesDataPoint],
  })
  timeSeries!: RoutingRuleTimeSeriesDataPoint[];

  @ApiProperty({
    description: 'Geographic distribution by rule',
    type: [RoutingRuleGeoStat],
  })
  geoDistribution!: RoutingRuleGeoStat[];

  @ApiProperty({
    description: 'Device distribution by rule',
    type: [RoutingRuleDeviceStat],
  })
  deviceDistribution!: RoutingRuleDeviceStat[];
}
