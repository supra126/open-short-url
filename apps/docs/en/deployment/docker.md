# Docker Deployment

Deploy Open Short URL using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM recommended
- Domain name (for production)

## Quick Start

### 1. Create Project Directory

```bash
mkdir open-short-url && cd open-short-url
```

### 2. Create Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: shorturl-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: shorturl
      POSTGRES_PASSWORD: ${DB_PASSWORD:-your-secure-password}
      POSTGRES_DB: open_short_url
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shorturl -d open_short_url"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: shorturl-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/supra126/open-short-url-backend:latest
    container_name: shorturl-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://shorturl:${DB_PASSWORD:-your-secure-password}@postgres:5432/open_short_url
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-change-this-to-a-secure-secret}
      JWT_EXPIRES_IN: 7d
      CORS_ORIGIN: ${CORS_ORIGIN:-https://your-domain.com}
      SHORT_URL_DOMAIN: ${SHORT_URL_DOMAIN:-https://s.your-domain.com}
    ports:
      - "4101:4101"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4101/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: ghcr.io/supra126/open-short-url-frontend:latest
    container_name: shorturl-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL:-http://localhost:4101}
      NEXT_PUBLIC_SHORT_URL_DOMAIN: ${SHORT_URL_DOMAIN:-https://s.your-domain.com}
    ports:
      - "4100:4100"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4100"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 3. Create Environment File

```bash
# .env
DB_PASSWORD=your-secure-database-password
JWT_SECRET=your-32-character-secret-key-here
CORS_ORIGIN=https://your-domain.com
SHORT_URL_DOMAIN=https://s.your-domain.com
API_URL=https://api.your-domain.com
```

### 4. Start Services

```bash
docker-compose up -d
```

### 5. Run Database Migrations

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 6. Create Admin User

```bash
docker-compose exec backend npx prisma db seed
```

## Production Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | Database password | `secure-password-123` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-secret-key` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://your-domain.com` |
| `SHORT_URL_DOMAIN` | Short URL domain | `https://s.your-domain.com` |
| `API_URL` | Backend API URL | `https://api.your-domain.com` |

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

## Reverse Proxy Setup

### Nginx Configuration

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

        # CORS headers (if not handled by backend)
        # add_header Access-Control-Allow-Origin $http_origin;
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

### Traefik Configuration

```yaml
# docker-compose.traefik.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
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
docker-compose up -d --scale backend=3
```

## Monitoring

### Health Checks

```bash
# Check all services
docker-compose ps

# Check backend health
curl http://localhost:4101/health

# Check database connection
docker-compose exec postgres pg_isready -U shorturl
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
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
docker-compose exec postgres pg_dump -U shorturl open_short_url > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U shorturl open_short_url | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Database Restore

```bash
# Restore from backup
cat backup_20250115.sql | docker-compose exec -T postgres psql -U shorturl open_short_url

# Restore from gzipped backup
gunzip -c backup_20250115.sql.gz | docker-compose exec -T postgres psql -U shorturl open_short_url
```

### Redis Backup

```bash
# Create snapshot
docker-compose exec redis redis-cli BGSAVE

# Copy backup file
docker cp shorturl-redis:/data/dump.rdb ./redis_backup.rdb
```

## Updating

### Update to Latest Version

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

### Rollback

```bash
# Use specific version
docker-compose pull ghcr.io/supra126/open-short-url-backend:v1.0.0
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps
```

**Database connection failed:**
```bash
# Check if postgres is healthy
docker-compose exec postgres pg_isready -U shorturl

# Check connection from backend
docker-compose exec backend nc -zv postgres 5432
```

**Permission denied:**
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data
```

### Reset Everything

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong JWT secret
- [ ] Enable HTTPS with valid certificates
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Enable log rotation
- [ ] Use non-root user in containers
- [ ] Keep images updated

## Next Steps

- [Self-Hosted Deployment](/en/deployment/self-hosted) - Manual deployment
- [Configuration](/en/guide/configuration) - Advanced configuration
- [API Keys](/en/features/api-keys) - Programmatic access
