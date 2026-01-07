# Docker 部署

使用 Docker 和 Docker Compose 部署 Open Short URL。

## 前置需求

- Docker 20.10+
- Docker Compose 2.0+
- 建議 2GB+ RAM
- 網域名稱（正式環境）

## 快速開始

### 1. 建立專案目錄

```bash
mkdir open-short-url && cd open-short-url
```

### 2. 建立 Docker Compose 檔案

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

### 3. 建立環境檔案

```bash
# .env
DB_PASSWORD=your-secure-database-password
JWT_SECRET=your-32-character-secret-key-here
CORS_ORIGIN=https://your-domain.com
SHORT_URL_DOMAIN=https://s.your-domain.com
API_URL=https://api.your-domain.com
```

### 4. 啟動服務

```bash
docker-compose up -d
```

### 5. 執行資料庫遷移

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 6. 建立管理員帳號

```bash
docker-compose exec backend npx prisma db seed
```

## 正式環境設定

### 環境變數

| 變數 | 說明 | 範例 |
|-----|------|------|
| `DB_PASSWORD` | 資料庫密碼 | `secure-password-123` |
| `JWT_SECRET` | JWT 簽名密鑰（32+ 字元） | `your-secret-key` |
| `CORS_ORIGIN` | 允許的 CORS 來源 | `https://your-domain.com` |
| `SHORT_URL_DOMAIN` | 短網址網域 | `https://s.your-domain.com` |
| `API_URL` | 後端 API URL | `https://api.your-domain.com` |

### 產生安全密鑰

```bash
# 產生 JWT 密鑰
openssl rand -base64 32

# 產生資料庫密碼
openssl rand -base64 24
```

## 反向代理設定

### Nginx 設定

```nginx
# /etc/nginx/sites-available/shorturl

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

    location / {
        proxy_pass http://localhost:4101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS 標頭（如後端未處理）
        # add_header Access-Control-Allow-Origin $http_origin;
    }
}

# 短網址重導向服務
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

### Traefik 設定

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

## SSL 憑證

### 使用 Let's Encrypt 搭配 Certbot

```bash
# 安裝 certbot
sudo apt install certbot python3-certbot-nginx

# 取得憑證
sudo certbot --nginx -d your-domain.com -d api.your-domain.com -d s.your-domain.com

# 自動更新（cron job 會自動新增）
sudo certbot renew --dry-run
```

## 資源管理

### 記憶體限制

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

### 擴展服務

```bash
# 擴展後端服務
docker-compose up -d --scale backend=3
```

## 監控

### 健康檢查

```bash
# 檢查所有服務
docker-compose ps

# 檢查後端健康
curl http://localhost:4101/health

# 檢查資料庫連線
docker-compose exec postgres pg_isready -U shorturl
```

### 日誌

```bash
# 查看所有日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend

# 查看最後 100 行
docker-compose logs --tail=100 backend
```

### 日誌輪替

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 備份與還原

### 資料庫備份

```bash
# 建立備份
docker-compose exec postgres pg_dump -U shorturl open_short_url > backup_$(date +%Y%m%d).sql

# 自動備份腳本
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U shorturl open_short_url | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 保留最近 7 天
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### 資料庫還原

```bash
# 從備份還原
cat backup_20250115.sql | docker-compose exec -T postgres psql -U shorturl open_short_url

# 從壓縮備份還原
gunzip -c backup_20250115.sql.gz | docker-compose exec -T postgres psql -U shorturl open_short_url
```

### Redis 備份

```bash
# 建立快照
docker-compose exec redis redis-cli BGSAVE

# 複製備份檔案
docker cp shorturl-redis:/data/dump.rdb ./redis_backup.rdb
```

## 更新

### 更新至最新版本

```bash
# 拉取最新映像檔
docker-compose pull

# 使用新映像檔重啟
docker-compose up -d

# 如需要執行遷移
docker-compose exec backend npx prisma migrate deploy
```

### 回滾

```bash
# 使用特定版本
docker-compose pull ghcr.io/supra126/open-short-url-backend:v1.0.0
docker-compose up -d
```

## 疑難排解

### 常見問題

**容器無法啟動：**
```bash
# 檢查日誌
docker-compose logs backend

# 檢查容器狀態
docker-compose ps
```

**資料庫連線失敗：**
```bash
# 檢查 postgres 是否健康
docker-compose exec postgres pg_isready -U shorturl

# 從後端檢查連線
docker-compose exec backend nc -zv postgres 5432
```

**權限被拒：**
```bash
# 修復 volume 權限
sudo chown -R 1000:1000 ./data
```

### 重置所有

```bash
# 停止所有容器
docker-compose down

# 移除 volumes（警告：會刪除所有資料）
docker-compose down -v

# 重新開始
docker-compose up -d
```

## 安全檢查清單

- [ ] 變更預設資料庫密碼
- [ ] 產生強 JWT 密鑰
- [ ] 啟用 HTTPS 並使用有效憑證
- [ ] 設定防火牆規則
- [ ] 設定定期備份
- [ ] 啟用日誌輪替
- [ ] 在容器中使用非 root 使用者
- [ ] 保持映像檔更新

## 下一步

- [自建部署](/zh-TW/deployment/self-hosted) - 手動部署
- [設定](/zh-TW/guide/configuration) - 進階設定
- [API Keys](/zh-TW/features/api-keys) - 程式化存取
