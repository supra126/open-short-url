# API Reference

Complete REST API documentation for Open Short URL.

## Overview

Open Short URL provides a comprehensive REST API for programmatic access to all features.

**Base URL:** `https://your-domain.com/api`

**Interactive Documentation:** Access Swagger UI at `/api` when running the backend.

## Authentication

### JWT Authentication (Recommended for Web Apps)

1. Login via `POST /api/auth/login` - token stored in httpOnly cookie
2. JWT token is automatically sent via cookie for subsequent requests

### API Key Authentication (Recommended for Server-to-Server)

1. Create API Key via `POST /api/api-keys`
2. Add to request headers: `X-API-Key: <your-api-key>`

---

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"  // Optional, required if 2FA enabled
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "USER"
  },
  "accessToken": "jwt_token"
}
```

### Logout

```http
POST /api/auth/logout
```

### Get Current User

```http
GET /api/auth/me
```

### Change Password

```http
POST /api/auth/password
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Two-Factor Authentication

```http
# Setup 2FA
POST /api/auth/2fa/setup

# Enable 2FA
POST /api/auth/2fa/enable
{
  "code": "123456"
}

# Disable 2FA
POST /api/auth/2fa/disable
{
  "code": "123456",
  "password": "your_password"
}
```

---

## URLs

### Create Short URL

```http
POST /api/urls
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url",
  "customSlug": "my-link",           // Optional, 3-50 chars
  "title": "My Link",                // Optional
  "password": "secret",              // Optional, min 4 chars
  "expiresAt": "2025-12-31T23:59:59Z", // Optional, ISO 8601
  "utmSource": "newsletter",         // Optional
  "utmMedium": "email",              // Optional
  "utmCampaign": "summer_sale",      // Optional
  "utmTerm": "discount",             // Optional
  "utmContent": "banner_top"         // Optional
}
```

### List URLs

```http
GET /api/urls?page=1&limit=10&search=keyword&status=ACTIVE
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `search` | string | Search in title and URL |
| `status` | string | Filter by status: `ACTIVE`, `INACTIVE` |
| `sortBy` | string | Sort field |
| `sortOrder` | string | `asc` or `desc` |

### Get URL Details

```http
GET /api/urls/{id}
```

### Update URL

```http
PATCH /api/urls/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "ACTIVE",
  "password": "new_password",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

### Delete URL

```http
DELETE /api/urls/{id}
```

### Get URL Stats

```http
GET /api/urls/stats
```

### Generate QR Code

```http
GET /api/urls/{id}/qrcode?width=300&color=%23000000
```

### Bulk Operations

```http
# Bulk Create
POST /api/urls/bulk
Content-Type: application/json

{
  "urls": [
    { "originalUrl": "https://example1.com" },
    { "originalUrl": "https://example2.com", "customSlug": "ex2" }
  ]
}

# Bulk Update Status
PATCH /api/urls/bulk
{
  "urlIds": ["id1", "id2"],
  "status": "INACTIVE"
}

# Bulk Delete
DELETE /api/urls/bulk
{
  "urlIds": ["id1", "id2"]
}
```

---

## A/B Testing (Variants)

### Create Variant

```http
POST /api/urls/{id}/variants
Content-Type: application/json

{
  "name": "Variant A",
  "targetUrl": "https://example.com/page-v1",
  "weight": 50,
  "isActive": true
}
```

### List Variants

```http
GET /api/urls/{id}/variants
```

### Update Variant

```http
PATCH /api/urls/{id}/variants/{variantId}
Content-Type: application/json

{
  "name": "Updated Variant",
  "weight": 30,
  "isActive": false
}
```

### Delete Variant

```http
DELETE /api/urls/{id}/variants/{variantId}
```

---

## Analytics

### Get URL Analytics

```http
GET /api/analytics/urls/{id}?startDate=2025-01-01&endDate=2025-01-31&timezone=Asia/Taipei
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start date (ISO 8601) |
| `endDate` | string | End date (ISO 8601) |
| `timezone` | string | Timezone (e.g., `Asia/Taipei`) |

### Get Overview Analytics

```http
GET /api/analytics/overview?startDate=2025-01-01&endDate=2025-01-31
```

### Get Top URLs

```http
GET /api/analytics/top-urls?limit=10
```

### Get Recent Clicks

```http
GET /api/analytics/urls/{id}/recent-clicks?limit=20&includeBots=false
```

### Get Bot Analytics

```http
GET /api/analytics/urls/{id}/bots
GET /api/analytics/bots  # Overall bot analytics
```

### Get A/B Test Analytics

```http
GET /api/analytics/ab-tests
```

### Export Analytics

```http
GET /api/analytics/urls/{id}/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
GET /api/analytics/export?format=json  # Export all
```

**Export Formats:** `csv`, `json`

---

## Bundles

### Create Bundle

```http
POST /api/bundles
Content-Type: application/json

{
  "name": "Marketing Campaign",
  "description": "Q1 2025 campaign links",
  "color": "#FF5733",
  "icon": "🎯",
  "urlIds": ["url_id_1", "url_id_2"]
}
```

### List Bundles

```http
GET /api/bundles?page=1&limit=10&search=campaign&status=ACTIVE
```

### Get Bundle Details

```http
GET /api/bundles/{id}
```

### Update Bundle

```http
PATCH /api/bundles/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "color": "#3B82F6"
}
```

### Delete Bundle

```http
DELETE /api/bundles/{id}
```

### Archive / Restore Bundle

```http
POST /api/bundles/{id}/archive
POST /api/bundles/{id}/restore
```

### Get Bundle Stats

```http
GET /api/bundles/{id}/stats
```

### Manage Bundle URLs

```http
# Add single URL
POST /api/bundles/{id}/urls
{ "urlId": "url_id" }

# Add multiple URLs
POST /api/bundles/{id}/urls/batch
{ "urlIds": ["url_id_1", "url_id_2"] }

# Remove URL
DELETE /api/bundles/{id}/urls/{urlId}

# Update URL order
PATCH /api/bundles/{id}/urls/{urlId}/order
{ "order": 2 }
```

---

## API Keys

### Create API Key

```http
POST /api/api-keys
Content-Type: application/json

{
  "name": "Production Server",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**Response includes the key only once:**
```json
{
  "id": "key_id",
  "name": "Production Server",
  "key": "osu_xxxxxxxxxxxxxxxx",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### List API Keys

```http
GET /api/api-keys
```

### Delete API Key

```http
DELETE /api/api-keys/{id}
```

---

## Webhooks

### Create Webhook

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["url.clicked", "url.created"],
  "secret": "your_webhook_secret"
}
```

**Available Events:**
- `url.created`
- `url.updated`
- `url.deleted`
- `url.clicked`

### List Webhooks

```http
GET /api/webhooks
```

### Update Webhook

```http
PATCH /api/webhooks/{id}
```

### Delete Webhook

```http
DELETE /api/webhooks/{id}
```

### Test Webhook

```http
POST /api/webhooks/{id}/test
```

### Get Webhook Logs

```http
GET /api/webhooks/{id}/logs
```

---

## Routing Rules (Smart Routing)

### Create Routing Rule

```http
POST /api/urls/{urlId}/routing-rules
Content-Type: application/json

{
  "name": "Mobile Users",
  "targetUrl": "https://example.com/mobile",
  "priority": 1,
  "conditions": {
    "logicalOperator": "AND",
    "items": [
      {
        "type": "DEVICE",
        "operator": "EQUALS",
        "value": "MOBILE"
      }
    ]
  }
}
```

### List Routing Rules

```http
GET /api/urls/{urlId}/routing-rules
```

### Update Routing Rule

```http
PATCH /api/urls/{urlId}/routing-rules/{ruleId}
```

### Delete Routing Rule

```http
DELETE /api/urls/{urlId}/routing-rules/{ruleId}
```

### Get Routing Templates

```http
GET /api/routing-templates
```

### Create Rule from Template

```http
POST /api/urls/{urlId}/routing-rules/from-template
{
  "templateId": "template_id",
  "targetUrl": "https://example.com/target"
}
```

---

## User Management (Admin)

### List Users

```http
GET /api/users?page=1&limit=10&search=email
```

### Create User

```http
POST /api/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "USER"
}
```

### Update User Role

```http
PATCH /api/users/{id}/role
{ "role": "ADMIN" }
```

### Update User Status

```http
PATCH /api/users/{id}/status
{ "status": "ACTIVE" }
```

### Reset User Password

```http
POST /api/users/{id}/reset-password
{ "newPassword": "new_password" }
```

### Delete User

```http
DELETE /api/users/{id}
```

---

## Audit Logs (Admin)

### List Audit Logs

```http
GET /api/audit-logs?page=1&limit=20&action=LOGIN&startDate=2025-01-01
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `action` | string | Filter by action type |
| `userId` | string | Filter by user ID |
| `startDate` | string | Start date |
| `endDate` | string | End date |

---

## Redirect Service

### Redirect to Original URL

```http
GET /{slug}
```

### Get URL Info

```http
GET /{slug}/info
```

### Verify Password

```http
POST /{slug}/verify
Content-Type: application/json

{
  "password": "link_password"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "originalUrl",
      "message": "Invalid URL format"
    }
  ]
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

- Default: 100 requests per minute
- Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
