# Configuration

Complete configuration reference for Open Short URL.

## Environment Files

- `apps/backend/.env` - Backend API configuration
- `apps/frontend/.env.local` - Frontend web app configuration

---

## Backend Configuration

### Required

These variables must be set for the application to function.

#### Environment

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |

```bash
NODE_ENV=production
```

#### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | See below |

```bash
# Connection pool parameters:
#   connection_limit: Max connections (dev: 10-15, prod: 20-30)
#   pool_timeout: Pool timeout in seconds (default: 10)
#   connect_timeout: Connection timeout in seconds (default: 5)
DATABASE_URL="postgresql://user:password@localhost:5432/open_short_url?schema=public&connection_limit=20"
```

#### URLs & Domains

| Variable | Description | Example |
|----------|-------------|---------|
| `SHORT_URL_DOMAIN` | Domain for short URLs | `https://s.yourdomain.com` |
| `FRONTEND_URL` | Frontend application URL | `https://app.yourdomain.com` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://app.yourdomain.com` |

```bash
SHORT_URL_DOMAIN="https://s.yourdomain.com"
FRONTEND_URL="https://app.yourdomain.com"
# Multiple origins: https://app1.example.com,https://app2.example.com
CORS_ORIGIN="https://app.yourdomain.com"
```

#### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Random string |
| `ADMIN_INITIAL_PASSWORD` | Initial admin account password | Strong password |

```bash
# Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secure-random-string-at-least-32-characters"
ADMIN_INITIAL_PASSWORD="your-strong-admin-password"
```

::: warning Security
- Use a cryptographically secure random string for `JWT_SECRET`
- Change `ADMIN_INITIAL_PASSWORD` immediately after first login
:::

---

### Recommended

These variables are optional but strongly recommended for production.

#### Redis Cache

Falls back to in-memory storage if not configured (not recommended for production).

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `REDIS_DB` | Redis database number | `0` |

```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

#### Proxy Settings

Enable if behind a reverse proxy (nginx, Cloudflare, etc.).

| Variable | Description | Default |
|----------|-------------|---------|
| `TRUSTED_PROXY` | Trust proxy headers | `false` |

```bash
# Reads client IP from X-Forwarded-For and X-Real-IP headers
TRUSTED_PROXY=true
```

::: warning
Only enable if you trust your proxy. Otherwise attackers can spoof IP addresses.
:::

#### Cloudflare Turnstile (Anti-Bot)

Protects password-protected URLs from bots.

| Variable | Description |
|----------|-------------|
| `TURNSTILE_SECRET_KEY` | Turnstile secret key |
| `TURNSTILE_SITE_KEY` | Turnstile site key |

```bash
# Get keys from: https://dash.cloudflare.com/turnstile
TURNSTILE_SECRET_KEY="0x..."
TURNSTILE_SITE_KEY="0x..."

# Testing keys (always passes):
# Site Key:   1x00000000000000000000AA
# Secret Key: 1x0000000000000000000000000000000AA
```

#### Webhooks

| Variable | Description |
|----------|-------------|
| `WEBHOOK_SECRET_KEY` | Default webhook signing key |

```bash
# Generate with: openssl rand -hex 32
WEBHOOK_SECRET_KEY="your-webhook-secret"
```

---

### Optional

These variables have sensible defaults and can be adjusted as needed.

#### Server

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `4101` |
| `HOST` | Server host binding | `0.0.0.0` |

```bash
PORT=4101
HOST=0.0.0.0
```

#### Cookie

| Variable | Description | Default |
|----------|-------------|---------|
| `COOKIE_DOMAIN` | Cookie domain for cross-subdomain auth | Auto-detected |

```bash
# Cross-subdomain (api.example.com & app.example.com): .example.com
# Single domain or localhost: leave empty
COOKIE_DOMAIN=.example.com
```

#### Authentication Options

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` |

```bash
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS=10
```

#### Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `THROTTLE_TTL` | Time window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `10` |

```bash
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

#### Slug Generation

Dynamic slug length based on total URL count.

| Variable | Description | Default |
|----------|-------------|---------|
| `SLUG_LENGTH_THRESHOLDS` | URL count thresholds | `1000,50000,500000` |
| `SLUG_LENGTHS` | Slug lengths per threshold | `4,5,6,7` |

```bash
# count < 1000         -> 4 chars
# 1000 <= count < 50000   -> 5 chars
# 50000 <= count < 500000 -> 6 chars
# count >= 500000         -> 7 chars
SLUG_LENGTH_THRESHOLDS="1000,50000,500000"
SLUG_LENGTHS="4,5,6,7"
```

#### Branding

| Variable | Description | Default |
|----------|-------------|---------|
| `BRAND_NAME` | Application name | `Open Short URL` |
| `BRAND_LOGO_URL` | Logo URL | - |

```bash
BRAND_NAME="My Short URLs"
BRAND_LOGO_URL="https://example.com/logo.png"
```

#### API Keys

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_API_KEYS_PER_USER` | Maximum API keys per user | `10` |

```bash
MAX_API_KEYS_PER_USER=10
```

#### Analytics

| Variable | Description | Default |
|----------|-------------|---------|
| `ANALYTICS_CACHE_TTL` | Cache TTL (seconds) | `300` |
| `ANALYTICS_TOP_URLS_LIMIT` | Top URLs in overview | `10` |
| `ANALYTICS_RECENT_CLICKS_LIMIT` | Recent clicks limit | `100` |
| `ANALYTICS_EXPORT_MAX_RECORDS` | Max records per export | `10000` |
| `ANALYTICS_EXPORT_BATCH_SIZE` | Export batch size | `1000` |
| `ANALYTICS_MAX_IN_MEMORY_CLICKS` | Max in-memory clicks | `50000` |
| `ANALYTICS_AGGREGATION_THRESHOLD` | DB aggregation threshold | `10000` |

```bash
ANALYTICS_CACHE_TTL=300
ANALYTICS_EXPORT_MAX_RECORDS=10000
```

#### Email (SMTP)

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `SMTP_FROM` | Default from address | - |

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@example.com"
```

---

## Frontend Configuration

### Required

#### Environment

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |

```bash
NODE_ENV=production
```

#### API Connection

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://s.yourdomain.com` |
| `NEXT_PUBLIC_SHORT_URL_DOMAIN` | Short URL domain | `https://s.yourdomain.com` |

```bash
NEXT_PUBLIC_API_URL="https://s.yourdomain.com"
NEXT_PUBLIC_SHORT_URL_DOMAIN="https://s.yourdomain.com"
```

---

### Recommended

#### Cloudflare Turnstile

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key |

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```

#### Branding

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BRAND_NAME` | Application name | `Open Short URL` |
| `NEXT_PUBLIC_BRAND_ICON_URL` | Brand icon URL | - |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | Brand description | - |

```bash
NEXT_PUBLIC_BRAND_NAME="My Short URLs"
NEXT_PUBLIC_BRAND_ICON_URL="https://example.com/icon.png"
NEXT_PUBLIC_BRAND_DESCRIPTION="URL shortening made simple"
```

---

### Optional

#### Internationalization

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_LOCALE` | Default locale | `en` |

```bash
# Available: en, zh-TW, pt-BR
NEXT_PUBLIC_LOCALE="en"
```

#### AI Features

AI is disabled by default. Configure at least one provider API key to enable.

**Settings:**

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | AI provider | - |
| `AI_MODEL` | AI model name | - |
| `AI_TEMPERATURE` | Response creativity (0.0-2.0) | `0.7` |
| `AI_MAX_TOKENS` | Max tokens in response | `4096` |
| `AI_TOP_P` | Top-p sampling (0.0-1.0) | `1.0` |

**Provider API Keys:**

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | GPT-4, GPT-3.5 |
| `ANTHROPIC_API_KEY` | Claude |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini |
| `MISTRAL_API_KEY` | Mistral |
| `COHERE_API_KEY` | Cohere |

```bash
AI_PROVIDER="anthropic"
AI_MODEL="claude-3-5-sonnet-20241022"
ANTHROPIC_API_KEY="sk-ant-..."
```

**Google Vertex AI:**

| Variable | Description |
|----------|-------------|
| `GOOGLE_VERTEX_PROJECT` | GCP project ID |
| `GOOGLE_VERTEX_LOCATION` | GCP region |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account path |

```bash
GOOGLE_VERTEX_PROJECT="your-gcp-project"
GOOGLE_VERTEX_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

---

## Complete Examples

### Backend (.env)

```bash
# ============================================================
# REQUIRED
# ============================================================
NODE_ENV=production
DATABASE_URL="postgresql://shorturl:password@localhost:5432/open_short_url?schema=public&connection_limit=20"
SHORT_URL_DOMAIN="https://s.yourdomain.com"
FRONTEND_URL="https://app.yourdomain.com"
CORS_ORIGIN="https://app.yourdomain.com"
JWT_SECRET="your-super-secure-random-string-at-least-32-characters"
ADMIN_INITIAL_PASSWORD="your-strong-admin-password"

# ============================================================
# RECOMMENDED
# ============================================================
REDIS_HOST="localhost"
REDIS_PORT="6379"
TRUSTED_PROXY=true
# TURNSTILE_SECRET_KEY=""
# TURNSTILE_SITE_KEY=""
# WEBHOOK_SECRET_KEY=""

# ============================================================
# OPTIONAL
# ============================================================
PORT=4101
JWT_EXPIRES_IN="7d"
THROTTLE_TTL=60
THROTTLE_LIMIT=10
BRAND_NAME="My Short URLs"
MAX_API_KEYS_PER_USER=10
ANALYTICS_CACHE_TTL=300
```

### Frontend (.env.local)

```bash
# ============================================================
# REQUIRED
# ============================================================
NODE_ENV=production
NEXT_PUBLIC_API_URL="https://s.yourdomain.com"
NEXT_PUBLIC_SHORT_URL_DOMAIN="https://s.yourdomain.com"

# ============================================================
# RECOMMENDED
# ============================================================
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
NEXT_PUBLIC_BRAND_NAME="My Short URLs"

# ============================================================
# OPTIONAL
# ============================================================
NEXT_PUBLIC_LOCALE="en"
# AI_PROVIDER="anthropic"
# AI_MODEL="claude-3-5-sonnet-20241022"
# ANTHROPIC_API_KEY=""
```

---

## Security Best Practices

1. **JWT Secret** - Use a random string of at least 32 characters
2. **Admin Password** - Use a strong password, change default immediately
3. **Database** - Use strong passwords and restrict access
4. **CORS** - Only allow your frontend domain
5. **HTTPS** - Always use HTTPS in production
6. **Proxy** - Only enable `TRUSTED_PROXY` behind trusted proxies
7. **Environment Files** - Never commit `.env` files to git
8. **API Keys** - Rotate API keys periodically

## Next Steps

- [URL Shortening](/en/features/url-shortening) - URL management features
- [Analytics](/en/features/analytics) - Analytics configuration
- [API Reference](/en/api/reference) - API documentation
