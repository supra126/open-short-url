# Audit Logs

Track all system activities with comprehensive audit logging.

## Overview

Audit logs record all significant actions in your Open Short URL instance, providing a complete history of who did what, when, and from where. Essential for security compliance and troubleshooting.

## Accessing Audit Logs

::: warning
Audit logs are only accessible to **Admin** users.
:::

### Query Logs

```
GET /api/audit-logs?page=1&pageSize=20
```

**Query Parameters:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number | 1 |
| `pageSize` | Items per page | 20 |
| `action` | Filter by action type | - |
| `entityType` | Filter by entity type | - |
| `userId` | Filter by user | - |
| `startDate` | Start date (ISO 8601) | - |
| `endDate` | End date (ISO 8601) | - |
| `sortBy` | Sort field | `createdAt` |
| `sortOrder` | Sort direction | `desc` |

### Example Response

```json
{
  "logs": [
    {
      "id": "log_123",
      "userId": "user_456",
      "action": "URL_CREATED",
      "entityType": "url",
      "entityId": "url_789",
      "oldValue": null,
      "newValue": {
        "slug": "my-link",
        "originalUrl": "https://example.com"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "requestId": "req_abc123"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

## Tracked Actions

### URL Actions

| Action | Description |
|--------|-------------|
| `URL_CREATED` | Short URL created |
| `URL_UPDATED` | Short URL updated |
| `URL_DELETED` | Short URL deleted |
| `URL_BULK_CREATED` | Multiple URLs created |
| `URL_BULK_UPDATED` | Multiple URLs updated |
| `URL_BULK_DELETED` | Multiple URLs deleted |

### User Actions

| Action | Description |
|--------|-------------|
| `USER_LOGIN` | User logged in |
| `USER_LOGOUT` | User logged out |
| `USER_CREATED` | New user created |
| `USER_UPDATED` | User profile updated |
| `USER_DELETED` | User deleted |
| `PASSWORD_CHANGED` | Password changed |
| `TWO_FACTOR_ENABLED` | 2FA enabled |
| `TWO_FACTOR_DISABLED` | 2FA disabled |

### API Key Actions

| Action | Description |
|--------|-------------|
| `API_KEY_CREATED` | API key created |
| `API_KEY_DELETED` | API key deleted |

### A/B Testing Actions

| Action | Description |
|--------|-------------|
| `VARIANT_CREATED` | A/B test variant created |
| `VARIANT_UPDATED` | Variant updated |
| `VARIANT_DELETED` | Variant deleted |

### Bundle Actions

| Action | Description |
|--------|-------------|
| `BUNDLE_CREATED` | Bundle created |
| `BUNDLE_UPDATED` | Bundle updated |
| `BUNDLE_DELETED` | Bundle deleted |

### Webhook Actions

| Action | Description |
|--------|-------------|
| `WEBHOOK_CREATED` | Webhook created |
| `WEBHOOK_UPDATED` | Webhook updated |
| `WEBHOOK_DELETED` | Webhook deleted |

### Routing Actions

| Action | Description |
|--------|-------------|
| `ROUTING_RULE_CREATED` | Routing rule created |
| `ROUTING_RULE_UPDATED` | Routing rule updated |
| `ROUTING_RULE_DELETED` | Routing rule deleted |

### System Actions

| Action | Description |
|--------|-------------|
| `SETTINGS_UPDATED` | System settings changed |

## Entity Types

| Entity Type | Description |
|-------------|-------------|
| `url` | Short URL |
| `user` | User account |
| `api_key` | API key |
| `bundle` | URL bundle |
| `webhook` | Webhook configuration |
| `variant` | A/B test variant |
| `routing_rule` | Smart routing rule |
| `settings` | System settings |

## Log Entry Fields

### Core Fields

| Field | Description |
|-------|-------------|
| `id` | Unique log entry ID |
| `userId` | User who performed action |
| `action` | Action type (see above) |
| `entityType` | Type of entity affected |
| `entityId` | ID of affected entity |
| `createdAt` | When action occurred |

### Change Tracking

| Field | Description |
|-------|-------------|
| `oldValue` | Previous state (JSON) |
| `newValue` | New state (JSON) |

**Example change:**

```json
{
  "action": "URL_UPDATED",
  "oldValue": {
    "title": "Old Title",
    "status": "ACTIVE"
  },
  "newValue": {
    "title": "New Title",
    "status": "INACTIVE"
  }
}
```

### Request Context

| Field | Description |
|-------|-------------|
| `ipAddress` | Client IP address |
| `userAgent` | Client user agent |
| `metadata` | Additional context |

**Metadata example:**

```json
{
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/urls"
}
```

## Filtering Examples

### By Action Type

```
GET /api/audit-logs?action=URL_CREATED
```

### By Entity Type

```
GET /api/audit-logs?entityType=url
```

### By User

```
GET /api/audit-logs?userId=user_123
```

### By Date Range

```
GET /api/audit-logs?startDate=2025-01-01&endDate=2025-01-31
```

### Combined Filters

```
GET /api/audit-logs?action=URL_CREATED&userId=user_123&startDate=2025-01-01
```

## Use Cases

### Security Monitoring

Track suspicious activities:

```
GET /api/audit-logs?action=USER_LOGIN&sortOrder=desc
```

Look for:
- Failed login attempts
- Logins from unusual locations
- After-hours activity

### Change Audit

Review who modified what:

```
GET /api/audit-logs?entityType=url&entityId=url_123
```

See complete history of a specific URL.

### Compliance Reporting

Generate reports for compliance:

```
GET /api/audit-logs?startDate=2025-01-01&endDate=2025-03-31&pageSize=1000
```

Export all activities for a quarter.

### Troubleshooting

Debug issues by tracing actions:

```
GET /api/audit-logs?entityId=url_123&sortBy=createdAt&sortOrder=asc
```

See chronological history.

## Log Retention

### Default Behavior

Audit logs are retained indefinitely by default.

### Recommended Practices

1. **Export regularly** - Archive logs for long-term storage
2. **Set retention policy** - Define how long to keep logs
3. **Monitor growth** - Track database size

## Best Practices

### 1. Regular Review

Check audit logs periodically:
- Daily for critical systems
- Weekly for general monitoring
- After security incidents

### 2. Set Up Alerts

Integrate with monitoring systems:
- Use webhooks for real-time alerts
- Track sensitive actions
- Monitor for anomalies

### 3. Export for Compliance

Maintain external backups:
- Export monthly/quarterly
- Store in secure location
- Retain per compliance requirements

### 4. Limit Access

Restrict audit log access:
- Admin users only
- Review who has admin access
- Log access to audit logs

## Security Considerations

### What's Logged

Audit logs capture:
- Who (userId)
- What (action, entity)
- When (timestamp)
- Where (IP, user agent)
- Changes (old/new values)

### What's NOT Logged

For privacy and security:
- Passwords (never stored)
- Full API keys (only prefixes)
- Sensitive request bodies

### IP Address Privacy

IP addresses are logged for security:
- May be considered personal data (GDPR)
- Implement retention policies as needed
- Anonymize if required

## Integration

### Export to SIEM

Send logs to security platforms:

```javascript
// Example: Export to Splunk
const logs = await fetchAuditLogs();
await sendToSplunk(logs);
```

### Webhook Integration

Get real-time audit notifications by combining with webhooks (custom implementation required).

## Next Steps

- [API Keys](/en/features/api-keys) - Manage API access
- [Webhooks](/en/features/webhooks) - Real-time notifications
- [API Reference](/en/api/reference) - Full API documentation
