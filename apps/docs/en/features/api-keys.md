# API Keys

Authenticate API requests programmatically with API keys.

## Overview

API keys enable programmatic access to Open Short URL's API without using session-based authentication. Use them for integrations, automations, and third-party applications.

## Creating API Keys

### Create an API Key

```json
POST /api/api-keys

{
  "name": "Mobile App Integration",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Parameters:**

| Parameter | Description | Required | Default |
|-----------|-------------|:--------:|---------|
| `name` | Descriptive name | ✅ | - |
| `expiresAt` | Expiration date (ISO 8601) | ❌ | Never |

**Response:**

```json
{
  "id": "key_123",
  "name": "Mobile App Integration",
  "key": "osu_a1b2c3d4e5f6g7h8i9j0...",
  "prefix": "osu_a1b2",
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

::: warning
The full API key is only shown once at creation time. Store it securely!
:::

## Using API Keys

### Authentication Header

Include the API key in your requests:

**Option 1: Bearer Token**
```
Authorization: Bearer osu_a1b2c3d4e5f6g7h8i9j0...
```

**Option 2: X-API-Key Header**
```
X-API-Key: osu_a1b2c3d4e5f6g7h8i9j0...
```

### Example Requests

**Create a short URL:**

```bash
curl -X POST https://api.yourdomain.com/api/urls \
  -H "Authorization: Bearer osu_a1b2c3d4e5f6g7h8..." \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com"}'
```

**Get analytics:**

```bash
curl https://api.yourdomain.com/api/analytics/overview \
  -H "X-API-Key: osu_a1b2c3d4e5f6g7h8..."
```

## Managing API Keys

### List All Keys

```
GET /api/api-keys
```

**Response:**

```json
{
  "apiKeys": [
    {
      "id": "key_123",
      "name": "Mobile App Integration",
      "prefix": "osu_a1b2",
      "expiresAt": "2025-12-31T23:59:59Z",
      "createdAt": "2025-01-15T10:00:00Z",
      "lastUsedAt": "2025-01-15T12:30:00Z"
    },
    {
      "id": "key_456",
      "name": "CI/CD Pipeline",
      "prefix": "osu_x9y8",
      "expiresAt": null,
      "createdAt": "2025-01-10T08:00:00Z",
      "lastUsedAt": "2025-01-15T09:15:00Z"
    }
  ],
  "total": 2
}
```

::: info
Full API keys are never returned after creation. Only the prefix is shown.
:::

### Get Single Key

```
GET /api/api-keys/{id}
```

### Delete Key

```
DELETE /api/api-keys/{id}
```

Deleted keys are immediately invalidated.

## Key Security

### Storage

API keys are stored securely:
- Hashed using bcrypt
- SHA-256 index for quick lookup
- Original key never stored

### Key Format

```
osu_<random-characters>
```

- Prefix: `osu_` (Open Short URL)
- Length: ~64 characters total
- Characters: alphanumeric

### Expiration

Keys can be set to expire:
- Set `expiresAt` when creating
- Expired keys return 401 Unauthorized
- No automatic cleanup (delete manually)

## Permissions

### API Key Scope

API keys have the same permissions as the user who created them:

| User Role | API Key Access |
|-----------|----------------|
| Admin | Full access to all endpoints |
| User | Access to own resources only |

### Supported Endpoints

All `/api/*` endpoints support API key authentication:

- URL management (`/api/urls/*`)
- Analytics (`/api/analytics/*`)
- Bundles (`/api/bundles/*`)
- Webhooks (`/api/webhooks/*`)
- A/B Testing (`/api/urls/*/variants/*`)
- Routing Rules (`/api/urls/*/routing-rules/*`)

## Rate Limits

| Operation | Limit |
|-----------|-------|
| API key creation | 5 requests/minute |
| API requests (with key) | Same as user limits |

### Per-User Limits

| Setting | Default |
|---------|---------|
| Max API keys per user | 10 |

Configure via `MAX_API_KEYS_PER_USER` environment variable.

## Best Practices

### 1. Use Descriptive Names

Name keys based on their purpose:
- ✅ "Production Backend Server"
- ✅ "GitHub Actions CI/CD"
- ❌ "API Key 1"

### 2. Set Expiration Dates

Use expiring keys when possible:
- Rotate keys periodically
- Limit damage from compromised keys
- Set reasonable lifetimes

### 3. One Key Per Integration

Create separate keys for each use case:
- Mobile app → dedicated key
- CI/CD → dedicated key
- Third-party service → dedicated key

### 4. Secure Storage

Never expose keys:
- Use environment variables
- Don't commit to version control
- Use secrets managers in production

**Example (Node.js):**

```javascript
// ✅ Good - from environment
const apiKey = process.env.OPEN_SHORT_URL_API_KEY;

// ❌ Bad - hardcoded
const apiKey = 'osu_a1b2c3d4...';
```

### 5. Monitor Usage

Track key usage:
- Check `lastUsedAt` regularly
- Delete unused keys
- Investigate unexpected activity

### 6. Rotate Regularly

Periodically replace keys:
1. Create new key
2. Update integrations
3. Delete old key

## Error Handling

### Authentication Errors

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Missing or invalid key |
| 401 | Key Expired | API key has expired |
| 403 | Forbidden | Key lacks permission |

### Example Error Response

```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

## Integration Examples

### Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.yourdomain.com',
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`
  }
});

// Create short URL
const response = await client.post('/api/urls', {
  originalUrl: 'https://example.com/page'
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {os.environ["API_KEY"]}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://api.yourdomain.com/api/urls',
    headers=headers,
    json={'originalUrl': 'https://example.com/page'}
)
```

### cURL

```bash
export API_KEY="osu_a1b2c3d4..."

curl -X POST https://api.yourdomain.com/api/urls \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com/page"}'
```

## Use Cases

### CI/CD Integration

Automate URL creation in deployment pipelines:

```yaml
# GitHub Actions example
- name: Create Short URL for Deploy
  run: |
    curl -X POST ${{ secrets.API_URL }}/api/urls \
      -H "Authorization: Bearer ${{ secrets.API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"originalUrl": "${{ env.DEPLOY_URL }}", "customSlug": "deploy-${{ github.sha }}"}'
```

### Mobile App

Create dynamic links from your app:

```swift
// Swift example
let request = URLRequest(url: apiURL)
request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
```

### Backend Service

Integrate with your existing systems:

```javascript
// Express middleware
app.post('/share', async (req, res) => {
  const shortUrl = await createShortUrl(req.body.url);
  res.json({ shortUrl });
});
```

## Next Steps

- [Webhooks](/en/features/webhooks) - Real-time notifications
- [API Reference](/en/api/reference) - Full API documentation
- [Audit Logs](/en/features/audit-logs) - Track API usage
