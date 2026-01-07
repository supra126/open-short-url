# Bundles

Organize and group your short URLs for better management.

## Overview

Bundles help you organize related short URLs into logical groups for easier management, tracking, and analysis. Group URLs by campaign, project, client, or any other criteria.

## Creating Bundles

### Create a Bundle

```json
POST /api/bundles

{
  "name": "Q1 Marketing Campaign",
  "description": "All URLs for Q1 2025 marketing activities",
  "color": "#3B82F6",
  "icon": "rocket"
}
```

**Parameters:**

| Parameter | Description | Required | Default |
|-----------|-------------|:--------:|---------|
| `name` | Bundle name | ✅ | - |
| `description` | Bundle description | ❌ | - |
| `color` | Display color (hex) | ❌ | #3B82F6 |
| `icon` | Icon name | ❌ | folder |
| `urlIds` | Initial URL IDs | ❌ | [] |

### Create with URLs

Add URLs when creating a bundle:

```json
POST /api/bundles

{
  "name": "Product Launch",
  "urlIds": ["url_123", "url_456", "url_789"]
}
```

## Managing Bundles

### List All Bundles

```
GET /api/bundles?page=1&pageSize=10&search=marketing&status=ACTIVE
```

**Query Parameters:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number | 1 |
| `pageSize` | Items per page | 10 |
| `search` | Search name/description | - |
| `status` | Filter by status | - |

### Get Bundle Details

```
GET /api/bundles/{id}
```

**Response includes:**
- Bundle information
- All URLs in the bundle
- URL statistics

### Update Bundle

```json
PUT /api/bundles/{id}

{
  "name": "Updated Name",
  "description": "New description",
  "color": "#EF4444",
  "icon": "star"
}
```

### Delete Bundle

```
DELETE /api/bundles/{id}
```

::: info
Deleting a bundle only removes the grouping. The URLs themselves are preserved.
:::

## URL Management

### Add Single URL

```json
POST /api/bundles/{id}/urls

{
  "urlId": "url_123"
}
```

### Add Multiple URLs

```json
POST /api/bundles/{id}/urls/batch

{
  "urlIds": ["url_123", "url_456", "url_789"]
}
```

### Remove URL from Bundle

```
DELETE /api/bundles/{id}/urls/{urlId}
```

::: info
Removing a URL from a bundle only removes the association. The URL remains active.
:::

### Reorder URLs

Change the display order of a URL within a bundle:

```json
PATCH /api/bundles/{id}/urls/{urlId}/order

{
  "order": 0
}
```

**Order is 0-based index** - `0` moves the URL to the first position.

## Bundle Statistics

### Get Bundle Stats

```
GET /api/bundles/{id}/stats
```

**Response:**
```json
{
  "bundleId": "bundle_123",
  "urlCount": 15,
  "totalClicks": 45000,
  "topUrls": [
    {
      "id": "url_123",
      "slug": "summer-sale",
      "clickCount": 12000
    },
    {
      "id": "url_456",
      "slug": "newsletter-jan",
      "clickCount": 8500
    }
  ],
  "clickTrend": [
    { "date": "2025-01-08", "clicks": 1200 },
    { "date": "2025-01-09", "clicks": 1350 },
    { "date": "2025-01-10", "clicks": 980 }
  ]
}
```

**Statistics include:**
- Total URLs in bundle
- Combined click count
- Top performing URLs
- Click trends (last 7 days)

## Bundle Status

### Available Statuses

| Status | Description |
|--------|-------------|
| `ACTIVE` | Bundle is visible and active |
| `ARCHIVED` | Bundle is hidden but preserved |

### Archive a Bundle

Hide a bundle without deleting it:

```
POST /api/bundles/{id}/archive
```

### Restore a Bundle

Bring back an archived bundle:

```
POST /api/bundles/{id}/restore
```

## Use Cases

### Marketing Campaigns

Organize campaign URLs:

```
Bundle: Summer Sale 2025
├── Homepage Banner → /summer-home
├── Email Newsletter → /summer-email
├── Social Media → /summer-social
├── Google Ads → /summer-ads
└── Influencer Links → /summer-inf-*
```

### Client Projects

Group URLs by client:

```
Bundle: Acme Corporation
├── Main Website → /acme-main
├── Product Catalog → /acme-products
├── Support Portal → /acme-support
└── Career Page → /acme-careers
```

### Product Launches

Track launch-related URLs:

```
Bundle: Product X Launch
├── Landing Page A (A/B) → /productx-a
├── Landing Page B (A/B) → /productx-b
├── Press Release → /productx-press
├── Demo Video → /productx-demo
└── Waitlist → /productx-waitlist
```

### Event Management

Organize event URLs:

```
Bundle: Tech Conference 2025
├── Registration → /conf-register
├── Schedule → /conf-schedule
├── Speaker Bios → /conf-speakers
├── Venue Info → /conf-venue
└── Live Stream → /conf-live
```

## Best Practices

### 1. Use Descriptive Names

Choose clear, meaningful bundle names:
- ✅ "Q1 2025 Email Campaign"
- ❌ "Campaign 1"

### 2. Consistent Color Coding

Use colors to categorize bundles:
- 🔵 Blue - Marketing
- 🟢 Green - Sales
- 🟣 Purple - Product
- 🟠 Orange - Events

### 3. Archive Old Bundles

Don't delete completed campaigns - archive them:
- Preserves historical data
- Keeps workspace clean
- Allows future reference

### 4. Regular Cleanup

Periodically review bundles:
- Remove unused URLs
- Update descriptions
- Archive completed campaigns

### 5. Use Icons

Choose relevant icons for quick identification:
- 📧 Email campaigns
- 📱 Social media
- 🎯 Advertising
- 📊 Analytics

## Bulk Operations with Bundles

### Add URLs to Bundle via Bulk Update

```json
PATCH /api/urls/bulk

{
  "urlIds": ["url_1", "url_2", "url_3"],
  "operation": "bundle",
  "value": "bundle_123"
}
```

This adds multiple URLs to a bundle in one operation.

## Next Steps

- [URL Shortening](/en/features/url-shortening) - Create more URLs
- [Analytics](/en/features/analytics) - Track bundle performance
- [A/B Testing](/en/features/ab-testing) - Test within bundles
