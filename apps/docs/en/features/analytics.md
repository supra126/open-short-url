# Analytics

Track and analyze your short URL performance with comprehensive analytics.

## Overview

Open Short URL provides detailed analytics for all your short URLs, including click tracking, geographic data, device information, referrer analysis, and bot detection.

## Metrics Overview

### Click Statistics

| Metric | Description |
|--------|-------------|
| **Total Clicks** | All clicks recorded |
| **Unique Visitors** | Distinct visitors (by IP) |
| **Average Clicks/Day** | Daily average over period |
| **Growth Rate** | Click growth percentage |

### Geographic Data

Track where your visitors come from:

- **Country** - Country-level breakdown
- **Region** - State/province data
- **City** - City-level granularity

Each location shows:
- Click count
- Percentage of total traffic

### Device & Browser

**Device Types:**
- Desktop
- Mobile
- Tablet
- Unknown

**Operating Systems:**
- Windows, macOS, Linux
- iOS, Android
- ChromeOS, and more

**Browsers:**
- Chrome, Safari, Firefox
- Edge, Opera
- And others

### Traffic Sources

**Referrer Tracking:**
- Direct traffic
- Social media referrals
- Search engine traffic
- Other website referrals

### UTM Parameter Tracking

Track marketing campaigns with UTM data:

| Parameter | Purpose |
|-----------|---------|
| `utm_source` | Traffic source (e.g., newsletter) |
| `utm_medium` | Medium (e.g., email, cpc) |
| `utm_campaign` | Campaign name |
| `utm_term` | Paid search keywords |
| `utm_content` | Content variation |

## Analytics Dashboard

### Single URL Analytics

```
GET /api/analytics/urls/{id}
```

**Query Parameters:**
| Parameter | Description | Default |
|-----------|-------------|---------|
| `startDate` | Start date (ISO 8601) | 30 days ago |
| `endDate` | End date (ISO 8601) | Today |
| `timezone` | Timezone (IANA format) | UTC |
| `includeBots` | Include bot traffic | false |

**Response includes:**
- Overview statistics
- Daily click trends
- Geographic breakdown
- Device/browser distribution
- Referrer sources
- UTM parameter data

### Overview Analytics

Get aggregated analytics for all your URLs:

```
GET /api/analytics/overview
```

Returns combined statistics across all short URLs.

### Top Performing URLs

```
GET /api/analytics/top-urls?limit=10
```

Returns URLs sorted by click count.

## Recent Clicks

View detailed information about recent visitors:

```
GET /api/analytics/urls/{id}/recent-clicks?limit=20&includeBots=false
```

**Response includes per click:**
```json
{
  "id": "click_123",
  "createdAt": "2025-01-15T10:30:00Z",
  "ipAddress": "192.168.x.x",
  "country": "Taiwan",
  "city": "Taipei",
  "device": "Mobile",
  "os": "iOS",
  "browser": "Safari",
  "referer": "https://facebook.com",
  "isBot": false,
  "utmSource": "facebook",
  "utmMedium": "social"
}
```

**Limits:**
- Default: 20 records
- Maximum: 100 records

## Bot Detection

Automatic detection and filtering of bot traffic:

### Bot Analytics

**Single URL:**
```
GET /api/analytics/urls/{id}/bots
```

**All URLs:**
```
GET /api/analytics/bots
```

**Response includes:**
- Total bot clicks
- Bot percentage
- Bot name distribution (Googlebot, Bingbot, etc.)

### Bot Filtering

By default, bot traffic is excluded from analytics. Use `includeBots=true` to include it.

**Detected Bot Types:**
- Search engine crawlers (Googlebot, Bingbot)
- Social media bots (FacebookBot, TwitterBot)
- Monitoring services
- SEO tools

## Date Range Support

### Maximum Range

Analytics supports up to **365 days** of historical data.

### Relative Ranges

Common preset ranges:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

### Timezone Support

Specify timezone using IANA format:
```
timezone=Asia/Taipei
timezone=America/New_York
timezone=Europe/London
```

## Data Export

Export your analytics data for external analysis.

### Export Formats

| Format | Description |
|--------|-------------|
| **CSV** | Spreadsheet compatible (UTF-8 BOM for Excel) |
| **JSON** | Structured data format |

### Single URL Export

```
GET /api/analytics/urls/{id}/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**
| Parameter | Description | Default |
|-----------|-------------|---------|
| `format` | Export format | csv |
| `startDate` | Start date | 30 days ago |
| `endDate` | End date | Today |
| `includeClicks` | Include click records | false |

### All URLs Export

```
GET /api/analytics/export?format=csv
```

### CSV Structure

```csv
# Analytics Export
# Exported At: 2025-01-15T12:00:00Z
# Date Range: 2025-01-01 to 2025-01-31
# URL Slug: my-short-url

## Overview
Metric,Value
Total Clicks,1500
Unique Visitors,1200
Average Clicks Per Day,50

## Daily Clicks
Date,Clicks
2025-01-01,45
2025-01-02,52
...

## Top Countries
Country,Clicks,Percentage
Taiwan,800,53.3%
United States,400,26.7%
...

## Browsers
Browser,Clicks,Percentage
Chrome,900,60%
Safari,400,26.7%
...

## Operating Systems
OS,Clicks,Percentage
Windows,600,40%
iOS,500,33.3%
...
```

### Export Limits

| Setting | Value |
|---------|-------|
| Max records per export | 10,000 |
| Batch size | 1,000 |

## A/B Test Analytics

View analytics for A/B testing experiments:

```
GET /api/analytics/ab-tests
```

**Response includes:**
- URLs with A/B testing enabled
- Click distribution per variant
- Conversion comparison

See [A/B Testing](/en/features/ab-testing) for details.

## Smart Routing Analytics

View routing rule performance:

```
GET /api/analytics/urls/{id}/routing
```

**Response includes:**
- Rule match counts
- Traffic distribution
- Time series trends

See [Smart Routing](/en/features/smart-routing) for details.

## Performance & Caching

### Cache Strategy

Analytics data is cached for performance:

| Data Type | Cache TTL |
|-----------|-----------|
| Analytics summary | 30 minutes |
| Click trends | 30 minutes |
| Top URLs | 30 minutes |

Cache is invalidated when new clicks are recorded.

### Performance Thresholds

| Setting | Value | Description |
|---------|-------|-------------|
| `MAX_IN_MEMORY_CLICKS` | 50,000 | Switch to DB aggregation |
| `AGGREGATION_THRESHOLD` | 10,000 | Use GROUP BY queries |

## Privacy Considerations

### Data Collection

Open Short URL collects:
- IP addresses (for geographic data)
- User agent strings (for device/browser detection)
- Referrer URLs (for traffic source analysis)
- UTM parameters (for campaign tracking)

### Data Retention

Configure data retention through environment variables. By default, click data is retained indefinitely.

### GDPR Compliance

- No personal data beyond IP addresses
- No tracking cookies
- No cross-site tracking
- Data export available for compliance

## Best Practices

1. **Use date ranges wisely** - Focus on relevant time periods
2. **Filter bot traffic** - Get accurate human visitor data
3. **Export regularly** - Backup important analytics data
4. **Track UTM parameters** - Measure campaign effectiveness
5. **Monitor trends** - Watch for traffic patterns

## Next Steps

- [A/B Testing](/en/features/ab-testing) - Optimize with experiments
- [Smart Routing](/en/features/smart-routing) - Route traffic conditionally
- [Webhooks](/en/features/webhooks) - Real-time click notifications
- [API Reference](/en/api/reference) - Access analytics via API
