# Self-Hosted Deployment

Deploy Open Short URL on your own infrastructure without Docker.

## Prerequisites

- Node.js 22+ (LTS recommended)
- pnpm 9+
- PostgreSQL 14+
- Redis 7+ (optional, recommended for production)
- Reverse proxy (nginx, Caddy, etc.)
- Linux server (Ubuntu 22.04+ recommended)

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 1 GB | 2+ GB |
| Storage | 10 GB | 20+ GB |

## Installation Steps

### 1. Install System Dependencies

**Ubuntu/Debian:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis (optional)
sudo apt install -y redis-server

# Install nginx
sudo apt install -y nginx

# Install build tools
sudo apt install -y build-essential git
```

**RHEL/CentOS:**

```bash
# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/supra126/open-short-url.git
sudo chown -R $USER:$USER open-short-url
cd open-short-url
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE open_short_url;
CREATE USER shorturl WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE open_short_url TO shorturl;
\c open_short_url
GRANT ALL ON SCHEMA public TO shorturl;
\q
```

### 5. Configure Environment

**Backend configuration:**

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

```bash
# Database
DATABASE_URL="postgresql://shorturl:your-secure-password@localhost:5432/open_short_url"

# Redis (optional but recommended)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="generate-a-32-character-secret-key"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="production"
PORT=4101
SHORT_URL_DOMAIN="https://s.your-domain.com"

# CORS
CORS_ORIGIN="https://your-domain.com"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

**Frontend configuration:**

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/frontend/.env`:

```bash
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
NEXT_PUBLIC_SHORT_URL_DOMAIN="https://s.your-domain.com"
```

### 6. Run Database Migrations

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate

# Seed initial data (creates admin user)
npx prisma db seed
```

### 7. Build Application

```bash
cd /opt/open-short-url
pnpm build
```

## Running with PM2

### Install PM2

```bash
npm install -g pm2
```

### Create Ecosystem File

```bash
# /opt/open-short-url/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'shorturl-backend',
      cwd: '/opt/open-short-url/apps/backend',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4101
      },
      max_memory_restart: '500M',
      error_file: '/var/log/shorturl/backend-error.log',
      out_file: '/var/log/shorturl/backend-out.log',
      merge_logs: true
    },
    {
      name: 'shorturl-frontend',
      cwd: '/opt/open-short-url/apps/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 4100',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '300M',
      error_file: '/var/log/shorturl/frontend-error.log',
      out_file: '/var/log/shorturl/frontend-out.log',
      merge_logs: true
    }
  ]
};
```

### Create Log Directory

```bash
sudo mkdir -p /var/log/shorturl
sudo chown -R $USER:$USER /var/log/shorturl
```

### Start Services

```bash
cd /opt/open-short-url
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
# Run the command it outputs
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Monitor
pm2 monit
```

## Running with systemd

### Create Service Files

**Backend service:**

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
WorkingDirectory=/opt/open-short-url/apps/backend
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=shorturl-backend
Environment=NODE_ENV=production
Environment=PORT=4101

[Install]
WantedBy=multi-user.target
```

**Frontend service:**

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
WorkingDirectory=/opt/open-short-url/apps/frontend
ExecStart=/usr/bin/npx next start -p 4100
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=shorturl-frontend
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable shorturl-backend shorturl-frontend
sudo systemctl start shorturl-backend shorturl-frontend

# Check status
sudo systemctl status shorturl-backend
sudo systemctl status shorturl-frontend
```

## Nginx Configuration

### Main Configuration

```bash
sudo nano /etc/nginx/sites-available/shorturl
```

```nginx
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
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
    ssl_protocols TLSv1.2 TLSv1.3;

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:4101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Short URL Redirect
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
    ssl_protocols TLSv1.2 TLSv1.3;

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

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/shorturl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificates

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d your-domain.com -d api.your-domain.com -d s.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## PostgreSQL Optimization

### Tuning for Production

Edit `/etc/postgresql/16/main/postgresql.conf`:

```ini
# Memory
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connections
max_connections = 100

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200
```

```bash
sudo systemctl restart postgresql
```

## Redis Configuration

### Persistence Settings

Edit `/etc/redis/redis.conf`:

```ini
# Append-only file for durability
appendonly yes
appendfsync everysec

# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis
```

## Firewall Configuration

### UFW Setup

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Monitoring

### Health Check Script

```bash
#!/bin/bash
# /opt/scripts/health-check.sh

BACKEND_URL="http://localhost:4101/health"
FRONTEND_URL="http://localhost:4100"

# Check backend
if ! curl -sf "$BACKEND_URL" > /dev/null; then
    echo "Backend is down!"
    pm2 restart shorturl-backend
fi

# Check frontend
if ! curl -sf "$FRONTEND_URL" > /dev/null; then
    echo "Frontend is down!"
    pm2 restart shorturl-frontend
fi
```

Add to crontab:

```bash
*/5 * * * * /opt/scripts/health-check.sh
```

### Log Management

```bash
# Logrotate configuration
sudo nano /etc/logrotate.d/shorturl
```

```
/var/log/shorturl/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/backup.sh

BACKUP_DIR="/var/backups/shorturl"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U shorturl -h localhost open_short_url | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup Redis
redis-cli BGSAVE
sleep 5
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup environment files
tar -czf $BACKUP_DIR/env_$DATE.tar.gz /opt/open-short-url/apps/*/env

# Clean old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:

```bash
0 2 * * * /opt/scripts/backup.sh >> /var/log/shorturl/backup.log 2>&1
```

## Updating

### Update Process

```bash
cd /opt/open-short-url

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Run migrations
cd apps/backend
npx prisma migrate deploy

# Rebuild
cd /opt/open-short-url
pnpm build

# Restart services
pm2 restart all
```

## Troubleshooting

### Check Service Status

```bash
# PM2
pm2 status
pm2 logs shorturl-backend --lines 100

# systemd
sudo systemctl status shorturl-backend
sudo journalctl -u shorturl-backend -f
```

### Check Ports

```bash
# Check if ports are in use
sudo ss -tlnp | grep -E '4100|4101'

# Check nginx
sudo nginx -t
```

### Database Connection

```bash
# Test connection
psql -U shorturl -h localhost -d open_short_url -c "SELECT 1"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

## Security Checklist

- [ ] Strong database password
- [ ] Secure JWT secret (32+ characters)
- [ ] HTTPS enabled with valid certificates
- [ ] Firewall configured (UFW)
- [ ] Regular security updates
- [ ] Automated backups
- [ ] Log rotation enabled
- [ ] Non-root user for services
- [ ] File permissions secured

## Next Steps

- [Docker Deployment](/en/deployment/docker) - Alternative deployment
- [Configuration](/en/guide/configuration) - Advanced settings
- [Webhooks](/en/features/webhooks) - Event notifications
