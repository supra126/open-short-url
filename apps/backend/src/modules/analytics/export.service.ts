import { Injectable } from '@nestjs/common';
import { AnalyticsResponseDto, RecentClickDto } from './dto/analytics-response.dto';

export interface ExportData {
  analytics: AnalyticsResponseDto;
  clicks?: RecentClickDto[];
  urlSlug?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  exportedAt: string;
}

@Injectable()
export class ExportService {
  /**
   * Format analytics data to CSV
   */
  formatToCSV(data: ExportData): string {
    const lines: string[] = [];
    const { analytics, clicks, dateRange, exportedAt, urlSlug } = data;

    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';

    // Header info
    lines.push('# Analytics Export');
    lines.push(`# Exported At: ${exportedAt}`);
    lines.push(`# Date Range: ${dateRange.startDate} to ${dateRange.endDate}`);
    if (urlSlug) {
      lines.push(`# URL Slug: ${urlSlug}`);
    }
    lines.push('');

    // Overview section
    lines.push('## Overview');
    lines.push('Metric,Value');
    lines.push(`Total Clicks,${analytics.overview.totalClicks}`);
    lines.push(`Unique Visitors,${analytics.overview.uniqueVisitors}`);
    lines.push(`Average Clicks Per Day,${analytics.overview.averageClicksPerDay.toFixed(2)}`);
    lines.push(`Growth Rate,${analytics.overview.growthRate.toFixed(2)}%`);
    lines.push('');

    // Time series section
    lines.push('## Daily Clicks');
    lines.push('Date,Clicks');
    for (const point of analytics.timeSeries) {
      lines.push(`${point.date},${point.clicks}`);
    }
    lines.push('');

    // Countries section
    if (analytics.countries.length > 0) {
      lines.push('## Top Countries');
      lines.push('Country,Clicks,Percentage');
      for (const country of analytics.countries) {
        lines.push(`${this.escapeCSV(country.name)},${country.clicks},${country.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // Browsers section
    if (analytics.browsers.length > 0) {
      lines.push('## Browsers');
      lines.push('Browser,Clicks,Percentage');
      for (const browser of analytics.browsers) {
        lines.push(`${this.escapeCSV(browser.name)},${browser.clicks},${browser.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // Operating Systems section
    if (analytics.operatingSystems.length > 0) {
      lines.push('## Operating Systems');
      lines.push('OS,Clicks,Percentage');
      for (const os of analytics.operatingSystems) {
        lines.push(`${this.escapeCSV(os.name)},${os.clicks},${os.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // Devices section
    if (analytics.devices.length > 0) {
      lines.push('## Devices');
      lines.push('Device,Clicks,Percentage');
      for (const device of analytics.devices) {
        lines.push(`${this.escapeCSV(device.name)},${device.clicks},${device.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // Referers section
    if (analytics.referers.length > 0) {
      lines.push('## Referrers');
      lines.push('Referrer,Clicks,Percentage');
      for (const referer of analytics.referers) {
        lines.push(`${this.escapeCSV(referer.referer)},${referer.clicks},${referer.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // UTM sections
    if (analytics.utmSources.length > 0) {
      lines.push('## UTM Sources');
      lines.push('Source,Clicks,Percentage');
      for (const source of analytics.utmSources) {
        lines.push(`${this.escapeCSV(source.value)},${source.clicks},${source.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    if (analytics.utmMediums.length > 0) {
      lines.push('## UTM Mediums');
      lines.push('Medium,Clicks,Percentage');
      for (const medium of analytics.utmMediums) {
        lines.push(`${this.escapeCSV(medium.value)},${medium.clicks},${medium.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    if (analytics.utmCampaigns.length > 0) {
      lines.push('## UTM Campaigns');
      lines.push('Campaign,Clicks,Percentage');
      for (const campaign of analytics.utmCampaigns) {
        lines.push(`${this.escapeCSV(campaign.value)},${campaign.clicks},${campaign.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // Detailed clicks section (if requested)
    if (clicks && clicks.length > 0) {
      lines.push('## Click Records');
      lines.push('Time,IP,Country,City,Browser,OS,Device,Referrer,UTM Source,UTM Medium,UTM Campaign,Is Bot');
      for (const click of clicks) {
        lines.push([
          this.escapeCSV(String(click.createdAt)),
          this.escapeCSV(click.ip || ''),
          this.escapeCSV(click.country || ''),
          this.escapeCSV(click.city || ''),
          this.escapeCSV(click.browser || ''),
          this.escapeCSV(click.os || ''),
          this.escapeCSV(click.device || ''),
          this.escapeCSV(click.referer || ''),
          this.escapeCSV(click.utmSource || ''),
          this.escapeCSV(click.utmMedium || ''),
          this.escapeCSV(click.utmCampaign || ''),
          click.isBot ? 'Yes' : 'No',
        ].join(','));
      }
    }

    return BOM + lines.join('\n');
  }

  /**
   * Format analytics data to JSON
   */
  formatToJSON(data: ExportData): string {
    return JSON.stringify({
      exportedAt: data.exportedAt,
      dateRange: data.dateRange,
      urlSlug: data.urlSlug,
      summary: {
        totalClicks: data.analytics.overview.totalClicks,
        uniqueVisitors: data.analytics.overview.uniqueVisitors,
        averageClicksPerDay: data.analytics.overview.averageClicksPerDay,
        growthRate: data.analytics.overview.growthRate,
      },
      timeSeries: data.analytics.timeSeries,
      countries: data.analytics.countries,
      browsers: data.analytics.browsers,
      operatingSystems: data.analytics.operatingSystems,
      devices: data.analytics.devices,
      referers: data.analytics.referers,
      utmSources: data.analytics.utmSources,
      utmMediums: data.analytics.utmMediums,
      utmCampaigns: data.analytics.utmCampaigns,
      clicks: data.clicks,
    }, null, 2);
  }

  /**
   * Escape CSV field value
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Generate filename for export
   */
  generateFilename(urlSlug: string | undefined, format: string, startDate: string, endDate: string): string {
    const prefix = urlSlug ? `analytics_${urlSlug}` : 'analytics_overview';
    return `${prefix}_${startDate}_${endDate}.${format}`;
  }
}
