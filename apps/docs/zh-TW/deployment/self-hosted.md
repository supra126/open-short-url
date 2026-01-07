# 自建部署

在您自己的基礎設施上部署 Open Short URL，無需 Docker。

## 前置需求

- Node.js 22+（建議 LTS）
- pnpm 9+
- PostgreSQL 14+
- Redis 7+（選用，正式環境建議）
- 反向代理（nginx、Caddy 等）
- Linux 伺服器（建議 Ubuntu 22.04+）

## 系統需求

| 元件 | 最低 | 建議 |
|-----|------|------|
| CPU | 1 核心 | 2+ 核心 |
| RAM | 1 GB | 2+ GB |
| 儲存 | 10 GB | 20+ GB |

## 安裝步驟

### 1. 安裝系統依賴

**Ubuntu/Debian：**

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安裝 pnpm
npm install -g pnpm

# 安裝 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安裝 Redis（選用）
sudo apt install -y redis-server

# 安裝 nginx
sudo apt install -y nginx

# 安裝建置工具
sudo apt install -y build-essential git
```

**RHEL/CentOS：**

```bash
# 安裝 Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# 安裝 pnpm
npm install -g pnpm

# 安裝 PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 複製儲存庫

```bash
cd /opt
sudo git clone https://github.com/supra126/open-short-url.git
sudo chown -R $USER:$USER open-short-url
cd open-short-url
```

### 3. 安裝依賴

```bash
pnpm install
```

### 4. 資料庫設定

```bash
# 切換到 postgres 使用者
sudo -u postgres psql

# 建立資料庫和使用者
CREATE DATABASE open_short_url;
CREATE USER shorturl WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE open_short_url TO shorturl;
\c open_short_url
GRANT ALL ON SCHEMA public TO shorturl;
\q
```

### 5. 環境設定

**後端設定：**

```bash
cp apps/backend/.env.example apps/backend/.env
```

編輯 `apps/backend/.env`：

```bash
# 資料庫
DATABASE_URL="postgresql://shorturl:your-secure-password@localhost:5432/open_short_url"

# Redis（選用但建議）
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="generate-a-32-character-secret-key"
JWT_EXPIRES_IN="7d"

# 應用程式
NODE_ENV="production"
PORT=4101
SHORT_URL_DOMAIN="https://s.your-domain.com"

# CORS
CORS_ORIGIN="https://your-domain.com"

# 速率限制
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

**前端設定：**

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

編輯 `apps/frontend/.env`：

```bash
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
NEXT_PUBLIC_SHORT_URL_DOMAIN="https://s.your-domain.com"
```

### 6. 執行資料庫遷移

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate

# 初始化資料（建立管理員帳號）
npx prisma db seed
```

### 7. 建置應用程式

```bash
cd /opt/open-short-url
pnpm build
```

## 使用 PM2 執行

### 安裝 PM2

```bash
npm install -g pm2
```

### 建立 Ecosystem 檔案

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

### 建立日誌目錄

```bash
sudo mkdir -p /var/log/shorturl
sudo chown -R $USER:$USER /var/log/shorturl
```

### 啟動服務

```bash
cd /opt/open-short-url
pm2 start ecosystem.config.js

# 儲存 PM2 設定
pm2 save

# 設定開機啟動腳本
pm2 startup
# 執行它輸出的指令
```

### PM2 指令

```bash
# 檢查狀態
pm2 status

# 查看日誌
pm2 logs

# 重啟全部
pm2 restart all

# 停止全部
pm2 stop all

# 監控
pm2 monit
```

## 使用 systemd 執行

### 建立 Service 檔案

**後端服務：**

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

**前端服務：**

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

### 啟用並啟動服務

```bash
sudo systemctl daemon-reload
sudo systemctl enable shorturl-backend shorturl-frontend
sudo systemctl start shorturl-backend shorturl-frontend

# 檢查狀態
sudo systemctl status shorturl-backend
sudo systemctl status shorturl-frontend
```

## Nginx 設定

### 主要設定

```bash
sudo nano /etc/nginx/sites-available/shorturl
```

```nginx
# 前端
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

    # 安全標頭
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

# API 後端
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

    # 增加 body 大小以支援檔案上傳
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:4101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 逾時設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# 短網址重導向
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

### 啟用網站

```bash
sudo ln -s /etc/nginx/sites-available/shorturl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL 憑證

### 使用 Let's Encrypt

```bash
# 安裝 certbot
sudo apt install -y certbot python3-certbot-nginx

# 取得憑證
sudo certbot --nginx -d your-domain.com -d api.your-domain.com -d s.your-domain.com

# 驗證自動更新
sudo certbot renew --dry-run
```

## PostgreSQL 最佳化

### 正式環境調校

編輯 `/etc/postgresql/16/main/postgresql.conf`：

```ini
# 記憶體
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB

# 連線
max_connections = 100

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# 查詢規劃器
random_page_cost = 1.1
effective_io_concurrency = 200
```

```bash
sudo systemctl restart postgresql
```

## Redis 設定

### 持久化設定

編輯 `/etc/redis/redis.conf`：

```ini
# 持久性的 append-only 檔案
appendonly yes
appendfsync everysec

# 記憶體限制
maxmemory 256mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis
```

## 防火牆設定

### UFW 設定

```bash
# 允許 SSH
sudo ufw allow ssh

# 允許 HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# 啟用防火牆
sudo ufw enable

# 檢查狀態
sudo ufw status
```

## 監控

### 健康檢查腳本

```bash
#!/bin/bash
# /opt/scripts/health-check.sh

BACKEND_URL="http://localhost:4101/health"
FRONTEND_URL="http://localhost:4100"

# 檢查後端
if ! curl -sf "$BACKEND_URL" > /dev/null; then
    echo "後端停止運作！"
    pm2 restart shorturl-backend
fi

# 檢查前端
if ! curl -sf "$FRONTEND_URL" > /dev/null; then
    echo "前端停止運作！"
    pm2 restart shorturl-frontend
fi
```

加入 crontab：

```bash
*/5 * * * * /opt/scripts/health-check.sh
```

### 日誌管理

```bash
# Logrotate 設定
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

## 備份策略

### 自動備份腳本

```bash
#!/bin/bash
# /opt/scripts/backup.sh

BACKUP_DIR="/var/backups/shorturl"
DATE=$(date +%Y%m%d_%H%M%S)

# 建立備份目錄
mkdir -p $BACKUP_DIR

# 備份 PostgreSQL
pg_dump -U shorturl -h localhost open_short_url | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 備份 Redis
redis-cli BGSAVE
sleep 5
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 備份環境檔案
tar -czf $BACKUP_DIR/env_$DATE.tar.gz /opt/open-short-url/apps/*/env

# 清理舊備份（保留 7 天）
find $BACKUP_DIR -type f -mtime +7 -delete

echo "備份完成：$DATE"
```

加入 crontab：

```bash
0 2 * * * /opt/scripts/backup.sh >> /var/log/shorturl/backup.log 2>&1
```

## 更新

### 更新流程

```bash
cd /opt/open-short-url

# 拉取最新變更
git pull origin main

# 安裝依賴
pnpm install

# 執行遷移
cd apps/backend
npx prisma migrate deploy

# 重新建置
cd /opt/open-short-url
pnpm build

# 重啟服務
pm2 restart all
```

## 疑難排解

### 檢查服務狀態

```bash
# PM2
pm2 status
pm2 logs shorturl-backend --lines 100

# systemd
sudo systemctl status shorturl-backend
sudo journalctl -u shorturl-backend -f
```

### 檢查連接埠

```bash
# 檢查連接埠是否被使用
sudo ss -tlnp | grep -E '4100|4101'

# 檢查 nginx
sudo nginx -t
```

### 資料庫連線

```bash
# 測試連線
psql -U shorturl -h localhost -d open_short_url -c "SELECT 1"

# 檢查日誌
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

## 安全檢查清單

- [ ] 強資料庫密碼
- [ ] 安全 JWT 密鑰（32+ 字元）
- [ ] 使用有效憑證啟用 HTTPS
- [ ] 設定防火牆（UFW）
- [ ] 定期安全更新
- [ ] 自動備份
- [ ] 啟用日誌輪替
- [ ] 使用非 root 使用者執行服務
- [ ] 檔案權限保護

## 下一步

- [Docker 部署](/zh-TW/deployment/docker) - 替代部署方式
- [設定](/zh-TW/guide/configuration) - 進階設定
- [Webhooks](/zh-TW/features/webhooks) - 事件通知
