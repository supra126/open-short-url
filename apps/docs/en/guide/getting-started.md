# Getting Started

Get Open Short URL up and running in minutes.

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 22+ | LTS recommended |
| pnpm | 9+ | Package manager |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching layer (optional for dev, recommended for prod) |

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Copy the example environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/backend/.env` with your database credentials:

```bash
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/open_short_url"

# Redis (Optional for dev, recommended for prod)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Security (Required - generate a secure random string)
JWT_SECRET="your-secure-random-string-at-least-32-chars"

# URLs (Required)
SHORT_URL_DOMAIN="http://localhost:4101"
FRONTEND_URL="http://localhost:4100"
CORS_ORIGIN="http://localhost:4100"
```

### 4. Setup Database

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4100 |
| Backend API | http://localhost:4101 |
| Swagger UI | http://localhost:4101/api |

### 6. Create Your First Short URL

1. Open http://localhost:4100 in your browser
2. Register a new account or login
3. Click "Create New URL"
4. Enter a long URL and optionally customize the slug
5. Click "Create" - your short URL is ready!

## Default Credentials

If seed data is enabled, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123! |

::: warning
Change default credentials immediately in production!
:::

## Project Structure

```
open-short-url/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/     # Authentication module
│   │   │   ├── url/      # URL management
│   │   │   ├── analytics/# Analytics module
│   │   │   └── ...
│   │   └── prisma/       # Database schema
│   ├── frontend/         # Next.js web app
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/
│   │   │   └── lib/      # Utilities & API
│   │   └── ...
│   └── docs/             # Documentation (this site)
├── packages/
│   └── mcp/              # MCP integration
└── package.json          # Root workspace config
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in development mode |
| `pnpm dev:backend` | Start only the backend |
| `pnpm dev:frontend` | Start only the frontend |
| `pnpm build` | Build all services for production |
| `pnpm prisma:studio` | Open Prisma Studio (database GUI) |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm lint` | Run linting on all packages |
| `pnpm type-check` | Run TypeScript type checking |

## Verifying Installation

### Check Backend Health

```bash
curl http://localhost:4101/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Access Swagger Documentation

Open http://localhost:4101/api in your browser to explore the API documentation.

## Common Issues

### Database Connection Failed

```
Error: P1001: Can't reach database server
```

**Solution:**
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check firewall settings

### Redis Connection Failed

```
Error: ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
- Ensure Redis is running
- Verify `REDIS_HOST` and `REDIS_PORT` in `.env`

### Port Already in Use

```
Error: EADDRINUSE: address already in use
```

**Solution:**
- Change port in `.env` (e.g., `PORT=4102`)
- Stop conflicting services

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
pnpm prisma:generate
```

## Next Steps

Now that you have Open Short URL running:

1. [Installation Guide](/en/guide/installation) - Production installation
2. [Configuration](/en/guide/configuration) - Advanced configuration options
3. [URL Shortening](/en/features/url-shortening) - Learn about URL features
4. [Analytics](/en/features/analytics) - Explore analytics capabilities
5. [API Reference](/en/api/reference) - Integrate via API
