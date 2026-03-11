# Docker Deployment

Deploy Open Short URL using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM recommended
- Domain name (for production)

## Quick Start

There are two ways to deploy with Docker:

1. **Build from source** -- clone the repo and use `docker-compose.yml`
2. **Use pre-built images** -- pull images from GHCR without cloning the repo

### Method 1: Build from Source

```bash
# Clone the repository
git clone https://github.com/supra126/open-short-url.git
cd open-short-url

# Create your environment file
cp .env.docker.example .env.docker
# Edit .env.docker with your settings (see Production Configuration below)

# Build and start all services
docker compose up -d
```

That is it. The backend container automatically runs database migrations and seeds the initial admin user on startup -- no manual steps are needed.

::: tip Default Admin Account
- **Email:** `admin@example.com`
- **Password:** the value of `ADMIN_INITIAL_PASSWORD` in your `.env.docker`
- If `ADMIN_INITIAL_PASSWORD` is not set, a random password is generated and printed in the backend logs:
  ```bash
  docker compose logs backend | grep -A2 "Admin credentials"
  ```
:::

### Method 2: Use Pre-built GHCR Images

If you do not want to clone the repository or build from source, create the following files manually.

Create a `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-open_short_url}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: >
      sh -c '
        if [ -n "$REDIS_PASSWORD" ]; then
          redis-server --requirepass "$REDIS_PASSWORD"
        else
          redis-server
        fi
      '
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
    volumes:
      - redis_data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ${REDIS_PASSWORD:+-a \"$REDIS_PASSWORD\"} ping | grep -q PONG"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/supra126/open-short-url-backend:latest
    restart: unless-stopped
    env_file:
      - path: .env.docker
        required: false
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 4101
      HOST: 0.0.0.0
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-open_short_url}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      ADMIN_INITIAL_PASSWORD: ${ADMIN_INITIAL_PASSWORD:-admin123}
      SHORT_URL_DOMAIN: ${SHORT_URL_DOMAIN:-http://localhost:4101}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:4100}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:4100}
      TRUSTED_PROXY: ${TRUSTED_PROXY:-true}
    ports:
      - "${BACKEND_PORT:-4101}:4101"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    image: ghcr.io/supra126/open-short-url-frontend:latest
    restart: unless-stopped
    environment:
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:4101}
      NEXT_PUBLIC_SHORT_URL_DOMAIN: ${NEXT_PUBLIC_SHORT_URL_DOMAIN:-http://localhost:4101}
      NEXT_PUBLIC_LOCALE: ${NEXT_PUBLIC_LOCALE:-en}
      NEXT_PUBLIC_BRAND_NAME: ${NEXT_PUBLIC_BRAND_NAME:-Open Short URL}
      NEXT_PUBLIC_BRAND_ICON_URL: ${NEXT_PUBLIC_BRAND_ICON_URL:-}
      NEXT_PUBLIC_BRAND_DESCRIPTION: ${NEXT_PUBLIC_BRAND_DESCRIPTION:-}
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}
      NEXT_PUBLIC_DOCS_URL: ${NEXT_PUBLIC_DOCS_URL:-https://supra126.github.io/open-short-url/}
    ports:
      - "${FRONTEND_PORT:-4100}:4100"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

::: tip Runtime Environment Replacement
The pre-built frontend image supports runtime environment variable replacement. The `NEXT_PUBLIC_*` variables listed above are automatically injected when the container starts -- no need to rebuild the image. Simply set the values in your `.env.docker` file or `environment` block.
:::

Create a `.env.docker` file with your configuration (see Production Configuration below), then start:

```bash
docker compose up -d
```

## Local Development with Docker

For local development, use `docker-compose.dev.yml` which only starts PostgreSQL and Redis. You then run the application code directly with `pnpm dev`:

```bash
# Start only database and cache services
docker compose -f docker-compose.dev.yml up -d

# Run the app in development mode
pnpm dev
```

The dev compose file uses hardcoded defaults (`postgres`/`postgres` for DB credentials, no Redis password) and stores data in separate volumes (`postgres_dev_data`, `redis_dev_data`) so it does not conflict with a production setup.

## Production Configuration

### Environment Variables

Copy `.env.docker.example` to `.env.docker` and update the values. The file is organized into sections:

#### Infrastructure

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `open_short_url` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5432` |
| `REDIS_PASSWORD` | Redis password (empty = no auth) | _(empty)_ |
| `REDIS_PORT` | Host port for Redis | `6379` |
| `BACKEND_PORT` | Host port for backend | `4101` |
| `FRONTEND_PORT` | Host port for frontend | `4100` |

#### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` |
| `ADMIN_INITIAL_PASSWORD` | Initial admin user password | `changeme-strong-admin-password` |
| `SHORT_URL_DOMAIN` | Domain shown in shortened links | `https://s.example.com` |
| `FRONTEND_URL` | Where the dashboard is hosted | `https://app.example.com` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `https://app.example.com` |

#### Backend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `COOKIE_DOMAIN` | Cookie domain for cross-subdomain auth | _(empty)_ |
| `TRUSTED_PROXY` | Set to `true` if behind nginx/cloudflare | `true` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | _(empty)_ |
| `THROTTLE_TTL` | Rate limit window in seconds | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `10` |
| `SMTP_HOST` | SMTP server hostname | _(empty)_ |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | _(empty)_ |
| `SMTP_PASSWORD` | SMTP password | _(empty)_ |
| `SMTP_FROM` | SMTP sender address | _(empty)_ |

#### Frontend

These variables configure the Next.js frontend. When building from source, they are passed as Docker build args. When using pre-built GHCR images, they are automatically replaced at container startup via the entrypoint script -- no rebuild needed.

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4101` |
| `NEXT_PUBLIC_SHORT_URL_DOMAIN` | Short URL domain shown in UI | `http://localhost:4101` |
| `NEXT_PUBLIC_LOCALE` | UI locale | `en` |
| `NEXT_PUBLIC_BRAND_NAME` | Brand name shown in UI | `Open Short URL` |
| `NEXT_PUBLIC_BRAND_ICON_URL` | Custom brand icon URL | _(empty)_ |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | Brand description | _(empty)_ |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | _(empty)_ |
| `NEXT_PUBLIC_DOCS_URL` | Documentation link URL | `https://supra126.github.io/open-short-url/` |

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

## SSL / HTTPS

### Built-in SSL with Caddy (Recommended)

The simplest way to enable HTTPS. Caddy is included as a Docker Compose profile -- it automatically obtains and renews Let's Encrypt certificates. No extra configuration files or environment variables needed.

```bash
# Start with built-in SSL
docker compose --profile ssl up -d
```

That is it. Caddy reads your `SHORT_URL_DOMAIN` and `FRONTEND_URL` from `.env.docker` and automatically:
- Obtains Let's Encrypt certificates for both domains
- Redirects HTTP to HTTPS
- Renews certificates automatically

::: tip When to use this
Use the built-in Caddy when you do **not** have an existing reverse proxy (nginx, Cloudflare proxy, etc.) and want zero-config HTTPS.

If you already have a reverse proxy handling SSL, use the standard `docker compose up -d` without the `ssl` profile.
:::

::: warning Prerequisites
- Ports 80 and 443 must be open and not used by another process
- Your domains must point to the server's public IP (DNS A record)
- Cloudflare users: use DNS-only mode (grey cloud), not proxied (orange cloud)
:::

### External Reverse Proxy

If you prefer to manage SSL yourself, use one of the following options with the standard `docker compose up -d` (without the `ssl` profile).

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/shorturl

# Frontend
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
        proxy_pass http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Backend
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Short URL Redirect Service
server {
    listen 80;
    server_name s.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name s.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/s.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/s.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Traefik Configuration

```yaml
services:
  traefik:
    image: traefik:v3.0
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=4100"

  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.your-domain.com`) || Host(`s.your-domain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=4101"

volumes:
  traefik_letsencrypt:
```

## SSL Certificates

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d your-domain.com -d api.your-domain.com -d s.your-domain.com

# Auto-renewal (cron job added automatically)
sudo certbot renew --dry-run
```

## Resource Management

### Memory Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  postgres:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  redis:
    deploy:
      resources:
        limits:
          memory: 128M
        reservations:
          memory: 64M
```

### Scaling

```bash
# Scale backend service
docker compose up -d --scale backend=3
```

## Monitoring

### Service Status

```bash
# Check all services
docker compose ps

# Check database readiness
docker compose exec postgres pg_isready -U postgres
```

### Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend
```

### Log Rotation

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Backup & Restore

### Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres open_short_url > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres open_short_url | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Database Restore

```bash
# Restore from backup
cat backup_20250115.sql | docker compose exec -T postgres psql -U postgres open_short_url

# Restore from gzipped backup
gunzip -c backup_20250115.sql.gz | docker compose exec -T postgres psql -U postgres open_short_url
```

### Redis Backup

```bash
# Create snapshot
docker compose exec redis redis-cli BGSAVE

# Copy backup file
docker compose cp redis:/data/dump.rdb ./redis_backup.rdb
```

## Updating

### Build from Source

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

The backend container automatically runs `prisma migrate deploy` and seeds any missing data on every startup, so no manual migration step is needed.

### Pre-built Images

```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d
```

### Rollback

```bash
# Use a specific version tag
# Edit docker-compose.yml to pin image versions, e.g.:
#   image: ghcr.io/supra126/open-short-url-backend:v1.0.0
docker compose up -d
```

## Troubleshooting

### Common Issues

**Container will not start:**
```bash
# Check logs
docker compose logs backend

# Check container status
docker compose ps
```

**Database connection failed:**
```bash
# Check if postgres is healthy
docker compose exec postgres pg_isready -U postgres

# Check connection from backend
docker compose exec backend nc -zv postgres 5432
```

**Permission denied:**
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data
```

### Reset Everything

```bash
# Stop all containers
docker compose down

# Remove volumes (WARNING: deletes all data)
docker compose down -v

# Start fresh
docker compose up -d
```

## Multi-platform Support

The Docker images support both `linux/amd64` and `linux/arm64` architectures. This means they work on standard x86 servers as well as ARM-based machines such as AWS Graviton or Apple Silicon (via Docker Desktop).

## Security Checklist

- [ ] Change default database password in `.env.docker`
- [ ] Generate a strong JWT secret with `openssl rand -base64 32`
- [ ] Set a strong `ADMIN_INITIAL_PASSWORD`
- [ ] Enable HTTPS with valid certificates
- [ ] Configure firewall rules (only expose ports 80/443 publicly)
- [ ] Do not expose PostgreSQL (5432) or Redis (6379) ports to the internet
- [ ] Set up regular database backups
- [ ] Enable log rotation
- [ ] Keep images updated
- [ ] Set `TRUSTED_PROXY=true` when behind a reverse proxy

## Next Steps

- [Self-Hosted Deployment](/en/deployment/self-hosted) - Manual deployment
- [Configuration](/en/guide/configuration) - Advanced configuration
- [API Keys](/en/features/api-keys) - Programmatic access
