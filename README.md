# Open Short URL

> **A powerful, self-hosted URL shortener with advanced analytics and privacy-first design**

Transform long, unwieldy URLs into short, memorable links while maintaining complete control over your data. Perfect for businesses, marketers, and privacy-conscious users who need more than basic link shortening.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/EATit9?referralCode=EnYHPz&utm_medium=integration&utm_source=template&utm_campaign=generic)
[![npm version](https://img.shields.io/npm/v/@open-short-url/mcp.svg)](https://www.npmjs.com/package/@open-short-url/mcp)

[English](#english) | [繁體中文](./README.zh-TW.md)

---

## Why Open Short URL?

### 🔐 Your Data, Your Control

Unlike commercial URL shorteners, your data stays on your server. No third-party tracking, no data selling, complete privacy.

### 💰 Cost-Effective

Free yourself from expensive SaaS subscriptions:

- No monthly or annual fees
- No link/click limits or quotas
- One-time infrastructure investment
- Scale without increasing costs
- Predictable operational expenses

### 📊 Comprehensive Analytics

Track every click with detailed insights:

- Real-time click tracking
- Geographic location data
- Device and browser analytics
- Referrer tracking
- UTM campaign monitoring

### 🎨 White-Label Ready

Fully customizable branding:

- Custom domain support
- Branded password pages
- Personalized logos and colors
- Your brand, your way

### 🔒 Advanced Security

- Password-protected URLs
- Expiration dates for temporary links
- Rate limiting to prevent abuse
- Cloudflare Turnstile integration
- Role-based access control (ADMIN/USER)

### 🚀 Enterprise Features

- RESTful API with comprehensive documentation
- API key management for integrations
- Webhook event notifications (HMAC-SHA256 signed)
- A/B testing (URL variants with traffic allocation)
- Link bundles for organizing URLs
- Bot detection and filtering
- Two-factor authentication (2FA)
- Bulk URL management
- QR code generation
- Multi-language support (English, Traditional Chinese, Portuguese)
- **AI-Powered Features**:
  - Built-in AI Chat Assistant (Anthropic Claude, OpenAI GPT, Google Gemini)
  - Model Context Protocol (MCP) server for external AI assistants

---

## Key Features

✨ **Smart Link Management**

- Custom slugs or auto-generated short codes
- Dynamic slug length based on usage
- Link expiration and scheduling
- Status control (ACTIVE/INACTIVE)

📈 **Powerful Analytics**

- Click statistics dashboard
- Time-series analysis
- Geographic distribution
- Device and platform breakdown
- UTM parameter tracking

🔑 **Flexible Authentication**

- JWT-based user authentication
- API key support for server integrations
- Two-factor authentication
- Session management

🎯 **Marketing Tools**

- Password protection for sensitive links
- UTM parameter builder
- QR code generation
- Brand customization

⚡ **High Performance**

- Optional Redis caching for fast redirects
- PostgreSQL for reliable data storage
- Optimized for scale

📦 **Link Organization**

- Group URLs into themed bundles/collections
- Custom bundle colors and icons
- Aggregate click statistics per bundle
- 7-day click trend visualization for bundles
- Manage multiple URLs in a single view
- Archive and restore bundles

🤖 **Bot Detection**

- Automatic bot traffic identification
- Filter bot clicks in analytics
- Bot type classification (Googlebot, Bingbot, etc.)
- Separate bot analytics dashboard
- Toggle bot visibility in click records

---

## Deployment

### One-Click Deploy to Railway

The fastest way to get started is deploying to Railway with a single click:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/EATit9?referralCode=EnYHPz&utm_medium=integration&utm_source=template&utm_campaign=generic)

This will automatically:

- ✅ Deploy frontend and backend services
- ✅ Provision PostgreSQL and Redis databases
- ✅ Configure environment variables

**Important:**

- ⚠️ Custom domains must be configured manually in Railway settings
- 🔐 Change the default admin password immediately after deployment

---

## Redis Usage Guidelines

Redis is **completely optional** with automatic graceful degradation. The system works perfectly without Redis.

### 🎯 **What Uses Redis?**

When Redis is available, these features use it for better performance:

1. **URL Query Cache** - Faster redirects (300ms → 10-20ms)
2. **Token Blacklist** - Shared across multiple instances (logout sync)
3. **Rate Limiting** - Accurate throttling across instances

### 🔄 **Automatic Fallback (No Redis Configuration)**

If `REDIS_HOST` is not set, the system automatically uses fallback mechanisms:

| Feature             | Without Redis                | Impact                           |
| ------------------- | ---------------------------- | -------------------------------- |
| **URL Cache**       | Disabled (direct DB queries) | Slower redirects, higher DB load |
| **Token Blacklist** | In-memory Map                | Works in single instance only    |
| **Rate Limiting**   | In-memory Map                | Works in single instance only    |

**System Status:** Fully functional, just slower for high traffic.

### ❌ **Skip Redis (< 10K daily clicks)**

**Perfect for:**

- Personal use or small team tools
- Development/testing environments
- Budget-constrained early stage
- Single-instance deployments

**Metrics:**

- Traffic: < 10,000 clicks/day (~0.12 QPS)
- Peak concurrency: < 10 requests/second

**Benefits:**

- ✅ Lower infrastructure costs (~$5-10/month)
- ✅ Simpler maintenance (one less service)
- ✅ No Redis configuration needed

### ✅ **Use Redis (> 50K daily clicks)**

**Recommended for:**

- Marketing campaigns with traffic spikes
- Frequent analytics page views
- Popular URLs (20% URLs = 80% traffic)
- Multi-instance deployments

**Metrics:**

- Traffic: > 50,000 clicks/day (~0.6 QPS)
- Peak concurrency: > 20 requests/second

**Performance boost:**

- Redirect time: 300ms → 10-20ms
- Database load: -70% to -90%
- Can handle 10-100x traffic
- Logout syncs across all instances

**Cost:** ~$15-25/month (5-10x performance improvement)

### ⚠️ **Redis Strongly Recommended (> 1M daily clicks)**

**Essential for:**

- SaaS products or high-traffic services
- Multi-instance production deployments
- Services requiring guaranteed rate limiting

**Metrics:**

- Traffic: > 1,000,000 clicks/day (~12 QPS)
- Peak concurrency: > 100 requests/second

**Risk without Redis:**

- Database becomes bottleneck
- Degraded user experience
- Rate limiting per instance (not global)

### 📊 **How to Decide**

Monitor these metrics:

- **DB query time** > 200ms → Consider Redis
- **Redirect response** > 500ms → Need optimization
- **Same URL** queried > 10 times/hour → Cache helps
- **Multiple instances** → Need Redis for sync

### 🚀 **Railway Deployment**

**Option A: Without Redis (Simple & Cheap)**

1. Don't add Redis service
2. Don't set `REDIS_HOST` environment variable
3. System uses automatic fallback
4. Cost: ~$5-10/month

**Option B: With Redis (Performance)**

1. Add Redis service in Railway
2. Environment variables auto-configured:
   ```
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.REDISPORT}}
   REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
   ```
3. System automatically detects and uses Redis
4. Cost: ~$15-25/month

**Switch anytime:** Add or remove Redis without code changes. The system automatically adapts.

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional, for caching)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment**

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env.local
# Edit apps/backend/.env.local with your database credentials

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit apps/frontend/.env.local with your API URL
# Optional: Set NEXT_PUBLIC_LOCALE=zh-TW for Traditional Chinese (default: en)
```

4. **Setup database**

```bash
cd apps/backend
pnpm prisma:migrate
pnpm prisma:seed
```

5. **Start development servers**

```bash
# From project root
pnpm dev
```

Visit:

- Frontend: http://localhost:4100
- Backend API: http://localhost:4101
- API Documentation: http://localhost:4101/api

Default credentials: `admin@example.com` / `admin123`

---

## 🤖 Built-in AI Chat Assistant

Manage your URLs through conversational AI directly in the web interface.

### Supported AI Providers

- **Anthropic Claude** (claude-3-5-sonnet, claude-3-5-haiku, etc.)
- **OpenAI GPT** (gpt-4o, gpt-4o-mini, gpt-4-turbo, etc.)
- **Google Gemini** (gemini-2.0-flash-exp, gemini-1.5-pro, etc.)
- **Mistral** (mistral-large-latest, mistral-medium, etc.)
- **Cohere** (command-r-plus, command-r, etc.)

### Setup

Configure AI by setting environment variables in your backend `.env.local`:

```bash
# Choose your AI provider
AI_PROVIDER=anthropic  # Options: anthropic, openai, google, mistral, cohere

# Anthropic Claude
AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# OpenAI GPT
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-your-api-key-here

# Google Gemini
AI_MODEL=gemini-2.0-flash-exp
GOOGLE_API_KEY=your-api-key-here

# Mistral
AI_MODEL=mistral-large-latest
MISTRAL_API_KEY=your-api-key-here

# Cohere
AI_MODEL=command-r-plus
COHERE_API_KEY=your-api-key-here
```

### Features

- 🗣️ **Natural Language Interface**: Manage URLs through conversation
- 🔧 **Automated Operations**: Create, update, delete URLs with simple commands
- 📊 **Analytics Queries**: Ask about click statistics and performance
- 🧪 **A/B Test Management**: Set up and manage URL variants
- 📁 **Bundle Organization**: Create and manage link collections
- 🌐 **Multi-language**: Full support for English and Traditional Chinese

### Access

Once configured, access the AI features:

- **AI Chat**: `/ai-chat` - Conversational interface for URL management
- **AI Settings**: `/ai-settings` - Configuration guide and status dashboard

### Example Commands

- "Create a short URL for https://example.com with slug 'promo'"
- "Show me all URLs created this week"
- "What are the top 5 most clicked URLs?"
- "Create a bundle for my summer campaign"
- "Set up A/B testing with 60/40 traffic split"

---

## 🤖 AI Assistant Integration (MCP)

Manage your short URLs through AI assistants using the Model Context Protocol (MCP) integration.

### What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that enables AI applications to securely connect to external tools and data sources. Our MCP server allows AI assistants like Claude Desktop, Cursor, and Windsurf to manage your short URLs through natural conversation.

### Installation

Install the MCP server globally:

```bash
npm install -g @open-short-url/mcp
```

### Configuration

Configure your MCP client (e.g., Claude Desktop) with:

```json
{
  "mcpServers": {
    "open-short-url": {
      "command": "open-short-url-mcp",
      "env": {
        "API_URL": "https://your-backend.com",
        "API_KEY": "ak_your_api_key_here"
      }
    }
  }
}
```

### What You Can Do

Once configured, you can ask your AI assistant to:

- "Create a short URL for https://example.com with custom slug 'promo'"
- "Show me all short URLs from this month"
- "Generate a QR code for my short URL abc123"
- "What are the click statistics for my campaign URLs?"
- "Create a bundle called 'Summer Campaign' and add these URLs..."
- "Set up A/B testing with 50/50 traffic split"

### Available Features

The MCP server provides 29 tools across:

- URL Management (create, list, update, delete, QR codes)
- Bundle Management (organize URLs into collections)
- Analytics (detailed click tracking and statistics)
- A/B Testing (create and manage URL variants)

### Learn More

- 📦 [MCP Server Package](https://www.npmjs.com/package/@open-short-url/mcp)
- 📖 [MCP Server Documentation](./packages/mcp/README.md)
- 🌐 [Model Context Protocol](https://modelcontextprotocol.io)

---

## Use Cases

### For Businesses

- Create branded short links for marketing campaigns
- Track campaign performance with detailed analytics
- Password-protect confidential links
- Maintain brand consistency across channels

### For Developers

- Self-hosted solution with full API access
- Integrate with existing systems via REST API
- Customize and extend functionality
- No vendor lock-in

### For Privacy Advocates

- Complete data ownership
- No third-party tracking
- GDPR compliant
- Open source transparency

---

## Link Bundles

Organize and manage your URLs efficiently with Link Bundles.

### Features

- **Visual Organization**: Color-coded bundles with custom icons (16 preset emojis)
- **Aggregate Analytics**:
  - Total clicks across all URLs in bundle
  - URL count and distribution
  - Top performing URL identification
  - 7-day click trend visualization
- **Flexible Management**:
  - Add/remove URLs dynamically
  - Custom ordering of URLs within bundles
  - Archive inactive bundles
  - Search and filter capabilities
- **Batch Operations**:
  - Add multiple URLs at once
  - Create bundles with URLs during creation
  - Manage URLs across different bundles

### Use Cases

- **Marketing Campaigns**: Group all campaign URLs together for unified tracking
- **Product Launches**: Organize URLs by product or feature
- **Social Media**: Bundle platform-specific URLs
- **Client Projects**: Separate URLs by client or project
- **Seasonal Content**: Organize time-sensitive URLs

### Statistics Tracking

Each bundle provides:

- Total clicks (sum of all URLs)
- URL count
- Top performing URL
- 7-day click trend chart
- Per-URL performance metrics

---

## Webhook Verification Guide

Open Short URL uses **HMAC-SHA256** signature mechanism to ensure webhook delivery security. Recipients must verify the signature to ensure requests are from your server.

### 📋 Verification Steps

The system includes an HMAC-SHA256 signature in the `X-Webhook-Signature` header of each webhook request. Here's how to verify it:

```javascript
const crypto = require('crypto');
const express = require('express');

function verifyWebhookSignature(request, secret) {
  // 1. Get signature from header
  const receivedSignature = request.headers['x-webhook-signature'];

  // 2. Read raw request body (must be complete JSON string)
  const payload = JSON.stringify(request.body);

  // 3. Recalculate signature using the same secret and algorithm
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // 4. Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Express.js usage example
const app = express();

app.post('/webhook', express.json(), (req, res) => {
  const secret = process.env.WEBHOOK_SECRET; // Your configured webhook secret

  // Verify signature
  if (!verifyWebhookSignature(req, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Get event information
  const event = req.headers['x-webhook-event'];
  const deliveryId = req.headers['x-webhook-delivery-id'];
  const attempt = req.headers['x-webhook-attempt'];

  // Process webhook event
  console.log('Event:', event);
  console.log('Delivery ID:', deliveryId);
  console.log('Attempt:', attempt);
  console.log('Data:', req.body.data);

  // Respond with success (2xx status code)
  res.status(200).json({ received: true });
});

app.listen(3000);
```

### ⚠️ Important Notes

1. **JSON Serialization**
   - Must use the same JSON serialization as the sender (no whitespace)
   - Don't add formatting parameters when using `JSON.stringify()`

2. **Raw Request Body**
   - Use raw body: don't modify request body before verification
   - Ensure body parser handles JSON correctly

3. **Timing-Safe Comparison**
   - Use `crypto.timingSafeEqual()` to prevent timing attacks
   - Don't use `===` or `==` to compare signatures

4. **Additional Headers**
   - `X-Webhook-Event`: Event type (e.g., `url.created`, `url.clicked`)
   - `X-Webhook-Delivery-Id`: Delivery ID (for idempotency checks to avoid duplicate processing)
   - `X-Webhook-Attempt`: Retry count (1-3, system automatically retries failed deliveries)

5. **Response Requirements**
   - Must respond within 10 seconds
   - Respond with 2xx status code for success
   - Non-2xx status codes will trigger retry mechanism (up to 3 times)

### 📦 Payload Structure

#### **url.created / url.updated / url.deleted**

```json
{
  "event": "url.created",
  "timestamp": "2025-10-21T02:05:16.123Z",
  "data": {
    "urlId": "clxxx123456789",
    "slug": "abc123",
    "originalUrl": "https://example.com",
    "userId": "user123"
  }
}
```

#### **url.clicked**

```json
{
  "event": "url.clicked",
  "timestamp": "2025-10-21T02:05:16.123Z",
  "data": {
    "urlId": "clxxx123456789",
    "slug": "abc123",
    "targetUrl": "https://example.com/landing-page",
    "variantId": "variant_id",
    "variantName": "Variant A",
    "clickData": {
      "ip": "1.2.3.4",
      "userAgent": "Mozilla/5.0...",
      "referer": "https://google.com",
      "browser": "Chrome",
      "os": "Windows",
      "device": "Desktop",
      "country": "TW",
      "isBot": false,
      "utmSource": "newsletter",
      "utmMedium": "email",
      "utmCampaign": "summer_sale",
      "utmTerm": "keyword",
      "utmContent": "header_link"
    }
  }
}
```

**Note:**

- `timestamp`: The exact time the click occurred (ISO 8601 format)
- `targetUrl`: The actual redirect target URL (for A/B tests, this will be the selected variant URL)
- `variantId` and `variantName`: Included if A/B test variant is selected; `null` if control group (original URL) is selected
- `clickData.browser/os/device`: Parsed from User-Agent string
- `clickData.country`: Parsed from IP address (country code)
- `clickData.isBot`: Whether the click is from a bot

### 🎯 Supported Event Types

- `url.created` - Triggered when a short URL is created
- `url.updated` - Triggered when a short URL is updated
- `url.deleted` - Triggered when a short URL is deleted
- `url.clicked` - Triggered when a short URL is clicked
- `webhook.test` - Triggered when testing a webhook

---

## Technology Stack

- **Backend**: NestJS, Prisma, PostgreSQL, Redis (optional)
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query
- **Security**: JWT, bcrypt, Cloudflare Turnstile
- **Analytics**: Real-time click tracking with geographic data, bot detection
- **Visualization**: Recharts for data visualization
- **AI Integration**: Model Context Protocol (MCP) server for AI assistant compatibility

---

## Roadmap

- [ ] Smart Routing (conditional redirects based on device, location, time)
- [ ] Open Graph / Social Preview Customization
- [ ] Deep Linking (App Links / Universal Links)
- [ ] Retargeting Pixel Integration

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- 🐛 [Issue Tracker](https://github.com/supra126/open-short-url/issues)
