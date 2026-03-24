# Open Short URL

> **A powerful, self-hosted URL shortener with advanced analytics and privacy-first design**

Transform long, unwieldy URLs into short, memorable links while maintaining complete control over your data. Perfect for businesses, marketers, and privacy-conscious users who need more than basic link shortening.

[English](./README.md) | [繁體中文](./README.zh-TW.md)

---

## Why Open Short URL?

### 🔐 Your Data, Your Control

Unlike commercial URL shorteners, your data stays on your server. No third-party tracking, no data selling, complete privacy. Perfect for privacy-conscious teams and GDPR-compliant organizations.

### 💰 Cost-Effective

Free yourself from expensive SaaS subscriptions:

- No monthly or annual fees
- No link/click limits or quotas
- One-time infrastructure investment
- Scale without increasing costs
- Predictable operational expenses

Ideal for businesses and marketers replacing expensive SaaS subscriptions.

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

Built for developers who need full API access and zero vendor lock-in.

---

## Deployment

### Try It Instantly (Zero Config)

```bash
curl -O https://raw.githubusercontent.com/supra126/open-short-url/main/docker-compose.quickstart.yml
docker compose -f docker-compose.quickstart.yml up -d
```

Visit `http://localhost:4100` and login with `admin@example.com` / `admin123`. For testing only -- not for production.

### Quick Setup (VPS / Docker)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/setup.sh)
```

The interactive script asks for your domain and admin password, generates secrets, and starts all services automatically.

### Deploy to Fly

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/fly-setup.sh)
```

Deploys both backend and frontend to Fly with Postgres. Also supports deploying backend only (frontend on Vercel).

### One-Click Deploy to PaaS

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/openshorturl-1?referralCode=EnYHPz&utm_medium=integration&utm_source=template&utm_campaign=generic)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/supra126/open-short-url)

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/supra126/open-short-url/tree/main)

Each platform will automatically provision PostgreSQL, deploy backend and frontend services, and configure environment variables.

### Vercel (Frontend Only)

If you prefer hosting the frontend on Vercel, deploy the backend using any option above, then:

1. Import the repo on Vercel
2. Set **Root Directory** to `apps/frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_SHORT_URL_DOMAIN` = your backend URL
4. Deploy

**After deployment:**

- 🔐 Change the default admin password immediately
- ⚠️ Configure custom domains in your platform's settings

---

## Redis

Redis is **completely optional**. The system works perfectly without it — when `REDIS_HOST` is not set, caching, token blacklist, and rate limiting automatically fall back to in-memory alternatives. Consider adding Redis when traffic exceeds 50K clicks/day or you run multiple instances.

---

## AI Integration

**Built-in AI Chat** — Manage URLs through natural language directly in the web UI. Supports Anthropic Claude, OpenAI GPT, Google Gemini, Mistral, and Cohere. Configure via environment variables in your frontend `.env.local`.

**MCP Server** — Connect external AI assistants (Claude Desktop, Cursor, Windsurf) to your instance via [Model Context Protocol](https://modelcontextprotocol.io). Install with `npm install -g @open-short-url/mcp`. See [MCP documentation](./packages/mcp/README.md) for setup.

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

- [x] Smart Routing (conditional redirects based on device, location, time)
- [x] Docker containerization with multi-platform images
- [x] Quick deploy (Vercel, Render, Railway, DigitalOcean, Fly, ...)
- [x] Open Graph / Social Preview Customization
- [ ] Deep Linking (App Links / Universal Links)
- [ ] Retargeting Pixel Integration

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- 📖 [Documentation](https://supra126.github.io/open-short-url)
- 🐛 [Issue Tracker](https://github.com/supra126/open-short-url/issues)
