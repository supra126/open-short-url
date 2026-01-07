# Installation

Comprehensive installation guide for Open Short URL in production environments.

## System Requirements

### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 1 core | 2+ cores |
| **Memory** | 1 GB | 2+ GB |
| **Storage** | 5 GB | 20+ GB |
| **Node.js** | 22.x | Latest LTS |
| **PostgreSQL** | 15.x | 16.x |
| **Redis** | 7.x | Latest stable |

### Supported Platforms

- Linux (Ubuntu 22.04+, Debian 12+, CentOS 9+)
- macOS (13+)
- Windows (WSL2 recommended)
- Docker (any platform)

## Installation Methods

### Method 1: From Source (Recommended)

Best for customization and development.

#### Step 1: Clone Repository

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

#### Step 2: Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm@9

# Install project dependencies
pnpm install
```

#### Step 3: Configure Environment

```bash
# Copy example environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Edit the environment files with your production values. See [Configuration](/en/guide/configuration) for details.

#### Step 4: Setup Database

```bash
# Create database (PostgreSQL)
createdb open_short_url

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm --filter backend prisma migrate deploy

# (Optional) Seed initial data
pnpm --filter backend db:seed-if-empty
```

#### Step 5: Build for Production

```bash
pnpm build
```

#### Step 6: Start Production Server

```bash
pnpm start
```

### Method 2: Docker

Best for quick deployment and isolation. See [Docker Deployment](/en/deployment/docker) for detailed instructions.

```bash
# Clone repository
git clone https://github.com/supra126/open-short-url.git
cd open-short-url

# Start with Docker Compose
docker-compose up -d
```

### Method 3: Railway (One-Click)

Best for managed hosting without infrastructure management.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/open-short-url)

Railway automatically provisions:
- PostgreSQL database
- Redis instance
- Environment variables

## Database Setup

### PostgreSQL Installation

#### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE USER shorturl WITH PASSWORD 'your-secure-password';
CREATE DATABASE open_short_url OWNER shorturl;
GRANT ALL PRIVILEGES ON DATABASE open_short_url TO shorturl;
\q
```

#### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16

createuser -s shorturl
createdb open_short_url -O shorturl
```

### Redis Installation

#### Ubuntu/Debian

```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### macOS (Homebrew)

```bash
brew install redis
brew services start redis
```

### Verify Database Connection

```bash
# Test PostgreSQL
psql -U shorturl -d open_short_url -c "SELECT 1"

# Test Redis
redis-cli ping
# Expected: PONG
```

## Process Management

### Using PM2 (Recommended)

PM2 provides process management, monitoring, and auto-restart.

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start "pnpm start:backend" --name shorturl-backend

# Start frontend
pm2 start "pnpm start:frontend" --name shorturl-frontend

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

#### PM2 Commands

```bash
pm2 status              # View all processes
pm2 logs                # View logs
pm2 logs shorturl-backend  # View specific logs
pm2 restart all         # Restart all processes
pm2 stop all            # Stop all processes
pm2 delete all          # Remove all processes
```

### Using systemd

Create service files for systemd management.

#### Backend Service

```bash
sudo nano /etc/systemd/system/shorturl-backend.service
```

```ini
[Unit]
Description=Open Short URL Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/open-short-url
ExecStart=/usr/bin/pnpm start:backend
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Frontend Service

```bash
sudo nano /etc/systemd/system/shorturl-frontend.service
```

```ini
[Unit]
Description=Open Short URL Frontend
After=network.target shorturl-backend.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/open-short-url
ExecStart=/usr/bin/pnpm start:frontend
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Enable Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable shorturl-backend shorturl-frontend
sudo systemctl start shorturl-backend shorturl-frontend
```

## Reverse Proxy Setup

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/shorturl
```

```nginx
# Frontend
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4100;
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

# Backend API + Short URL Redirects
server {
    listen 80;
    server_name s.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name s.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/shorturl /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d app.yourdomain.com -d s.yourdomain.com

# Auto-renewal is configured automatically
```

## Verification

### Health Checks

```bash
# Backend health
curl https://s.yourdomain.com/health

# Frontend accessibility
curl -I https://app.yourdomain.com
```

### Test Short URL Creation

1. Open `https://app.yourdomain.com`
2. Login with admin credentials
3. Create a test short URL
4. Visit `https://s.yourdomain.com/test-slug`
5. Verify redirect works

## Updating

### From Source

```bash
cd /opt/open-short-url

# Fetch latest changes
git fetch origin
git pull origin main

# Install new dependencies
pnpm install

# Run migrations
pnpm --filter backend prisma migrate deploy

# Rebuild
pnpm build

# Restart services
pm2 restart all
# or
sudo systemctl restart shorturl-backend shorturl-frontend
```

## Backup

### Database Backup

```bash
# Create backup
pg_dump -U shorturl -d open_short_url > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U shorturl -d open_short_url < backup_20250101.sql
```

### Automated Backups

```bash
# Add to crontab
crontab -e
```

```
# Daily backup at 2 AM
0 2 * * * pg_dump -U shorturl -d open_short_url > /backups/shorturl_$(date +\%Y\%m\%d).sql
```

## Next Steps

- [Configuration](/en/guide/configuration) - Configure all options
- [Docker Deployment](/en/deployment/docker) - Docker deployment guide
- [Self-Hosted](/en/deployment/self-hosted) - Advanced self-hosting
