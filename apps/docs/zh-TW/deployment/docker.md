# Docker 部署

使用 Docker 和 Docker Compose 部署 Open Short URL。

## 前置需求

- Docker 20.10+
- Docker Compose 2.0+
- 建議 2GB+ RAM
- 網域名稱（正式環境）

## 架構概覽

整個服務由四個容器組成：

| 服務 | 說明 | 連接埠 |
|------|------|--------|
| **frontend** | Next.js 前端應用 | 4100 |
| **backend** | NestJS 後端 API | 4101 |
| **postgres** | PostgreSQL 17-alpine 資料庫 | 5432 |
| **redis** | Redis 7-alpine 快取 | 6379 |
| **caddy** | Caddy 反向代理（選用，`--profile ssl`） | 80, 443 |

後端容器啟動時會自動執行 `prisma migrate deploy` 和 `seed-if-empty`，無需手動執行資料庫遷移或建立管理員帳號。

## 部署方式

有兩種部署方式可選：

1. **從原始碼建置** - 使用專案內建的 `docker-compose.yml`，從原始碼建置映像檔
2. **使用預建映像檔** - 使用 GHCR 上的預建映像檔，適合快速部署

---

## 方式一：從原始碼建置

### 1. 取得原始碼

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

### 2. 建立環境設定檔

```bash
cp .env.docker.example .env.docker
```

編輯 `.env.docker`，至少修改以下必要設定：

```bash
# ============================
# 基礎設施
# ============================

# PostgreSQL
POSTGRES_DB=open_short_url
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme-strong-password
POSTGRES_PORT=5432

# Redis（留空表示不設定密碼）
REDIS_PASSWORD=
REDIS_PORT=6379

# 連接埠對應
BACKEND_PORT=4101
FRONTEND_PORT=4100

# ============================
# 後端
# ============================

NODE_ENV=production
PORT=4101
HOST=0.0.0.0

# [必填] JWT 密鑰 - 使用以下指令產生: openssl rand -base64 32
JWT_SECRET=changeme-generate-a-strong-secret
JWT_EXPIRES_IN=7d

# [必填] 初始管理員密碼
ADMIN_INITIAL_PASSWORD=changeme-strong-admin-password

# [必填] 短網址網域（使用者看到的短網址網域）
SHORT_URL_DOMAIN=https://example.com

# [必填] 前端 URL（管理後台的網址）
FRONTEND_URL=https://app.example.com

# [必填] CORS 允許來源（通常與 FRONTEND_URL 相同）
CORS_ORIGIN=https://app.example.com

# Cookie 網域（跨子網域認證，例如 .example.com）
COOKIE_DOMAIN=

# 信任代理（若在 nginx/cloudflare 後方請設為 true）
TRUSTED_PROXY=true

# ============================
# 前端
# ============================

# 從原始碼建置時作為 build args；使用預建映像檔時會在啟動時自動替換
NEXT_PUBLIC_API_URL=https://example.com
NEXT_PUBLIC_SHORT_URL_DOMAIN=https://example.com
NEXT_PUBLIC_LOCALE=en
NEXT_PUBLIC_BRAND_NAME=Open Short URL
NEXT_PUBLIC_BRAND_ICON_URL=
NEXT_PUBLIC_BRAND_DESCRIPTION=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

### 3. 啟動服務

```bash
docker compose up -d
```

這就完成了。後端會自動執行資料庫遷移並建立初始管理員帳號。

::: tip 預設管理員帳號
- **Email：** `admin@example.com`
- **密碼：** 由 `.env.docker` 中的 `ADMIN_INITIAL_PASSWORD` 決定
- 若未設定 `ADMIN_INITIAL_PASSWORD`，系統會隨機產生密碼並印在後端 log 中：
  ```bash
  docker compose logs backend | grep -A2 "Admin credentials"
  ```
:::

### 4. 驗證服務

```bash
# 檢查所有服務狀態
docker compose ps

# 查看後端日誌確認啟動成功
docker compose logs backend
```

服務就緒後即可存取：
- 前端：`http://localhost:4100`
- 後端 API：`http://localhost:4101`

---

## 方式二：使用預建 GHCR 映像檔

如果不想從原始碼建置，可以直接使用預建映像檔。映像檔支援 `linux/amd64` 和 `linux/arm64` 雙平台。

### 1. 建立專案目錄

```bash
mkdir open-short-url && cd open-short-url
```

### 2. 建立 Docker Compose 檔案

```yaml
# docker-compose.yml
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

::: tip 執行時期環境變數替換
預建映像檔支援執行時期環境變數替換。上方列出的 `NEXT_PUBLIC_*` 變數會在容器啟動時自動注入，無需重新建置映像檔。只需在 `.env.docker` 或 `environment` 區塊中設定即可。
:::

### 3. 建立環境設定檔

建立 `.env.docker` 檔案，內容參照方式一的環境設定。

### 4. 啟動服務

```bash
docker compose up -d
```

---

## 本地開發模式

專案提供 `docker-compose.dev.yml`，僅啟動 PostgreSQL 和 Redis，讓你在本地用 `pnpm dev` 開發應用程式。

```bash
# 啟動資料庫和快取
docker compose -f docker-compose.dev.yml up -d

# 安裝依賴並啟動開發伺服器
pnpm install
pnpm dev
```

`docker-compose.dev.yml` 預設使用以下設定：
- PostgreSQL：`postgres:postgres@localhost:5432/open_short_url`
- Redis：`localhost:6379`（無密碼）

---

## 正式環境設定

### 環境變數一覽

#### 基礎設施

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `POSTGRES_DB` | 資料庫名稱 | `open_short_url` |
| `POSTGRES_USER` | 資料庫使用者 | `postgres` |
| `POSTGRES_PASSWORD` | 資料庫密碼 | `postgres` |
| `POSTGRES_PORT` | PostgreSQL 主機連接埠 | `5432` |
| `REDIS_PASSWORD` | Redis 密碼（留空表示無密碼） | （空） |
| `REDIS_PORT` | Redis 主機連接埠 | `6379` |
| `BACKEND_PORT` | 後端主機連接埠 | `4101` |
| `FRONTEND_PORT` | 前端主機連接埠 | `4100` |

#### 後端（必填）

| 變數 | 說明 | 範例 |
|------|------|------|
| `JWT_SECRET` | JWT 簽名密鑰 | `openssl rand -base64 32` |
| `ADMIN_INITIAL_PASSWORD` | 初始管理員密碼 | `your-strong-password` |
| `SHORT_URL_DOMAIN` | 短網址網域 | `https://s.example.com` |
| `FRONTEND_URL` | 前端 URL | `https://app.example.com` |
| `CORS_ORIGIN` | CORS 允許來源 | `https://app.example.com` |

#### 後端（選填）

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `JWT_EXPIRES_IN` | JWT 過期時間 | `7d` |
| `COOKIE_DOMAIN` | Cookie 網域 | （空） |
| `TRUSTED_PROXY` | 是否在反向代理後方 | `true` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 密鑰 | （空） |
| `THROTTLE_TTL` | 速率限制時間窗口（秒） | `60` |
| `THROTTLE_LIMIT` | 速率限制次數 | `10` |
| `SMTP_HOST` | SMTP 伺服器主機名稱 | （空） |
| `SMTP_PORT` | SMTP 伺服器連接埠 | `587` |
| `SMTP_USER` | SMTP 使用者名稱 | （空） |
| `SMTP_PASSWORD` | SMTP 密碼 | （空） |
| `SMTP_FROM` | SMTP 寄件人地址 | （空） |

#### 前端

這些變數用於設定 Next.js 前端。從原始碼建置時，它們作為 Docker build args 傳入。使用預建 GHCR 映像檔時，容器啟動時會透過 entrypoint 腳本自動替換，無需重新建置。

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 後端 API 位址 | `http://localhost:4101` |
| `NEXT_PUBLIC_SHORT_URL_DOMAIN` | 短網址網域 | `http://localhost:4101` |
| `NEXT_PUBLIC_LOCALE` | 介面語言 | `en` |
| `NEXT_PUBLIC_BRAND_NAME` | 品牌名稱 | `Open Short URL` |
| `NEXT_PUBLIC_BRAND_ICON_URL` | 品牌圖示 URL | （空） |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | 品牌描述 | （空） |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile 站點金鑰 | （空） |
| `NEXT_PUBLIC_DOCS_URL` | 文件連結 URL | `https://supra126.github.io/open-short-url/` |

### 產生安全密鑰

```bash
# 產生 JWT 密鑰
openssl rand -base64 32

# 產生資料庫密碼
openssl rand -base64 24
```

## SSL / HTTPS

### 內建 SSL（Caddy，推薦）

最簡單的 HTTPS 啟用方式。Caddy 以 Docker Compose profile 形式內建，自動申請並續期 Let's Encrypt 憑證。不需要額外的設定檔或環境變數。

```bash
# 啟動並啟用內建 SSL
docker compose --profile ssl up -d
```

就這樣。Caddy 會讀取 `.env.docker` 中的 `SHORT_URL_DOMAIN` 和 `FRONTEND_URL`，自動完成：
- 為兩個網域申請 Let's Encrypt 憑證
- HTTP 自動重導向至 HTTPS
- 憑證自動續期

::: tip 何時使用
當你**沒有**現有的反向代理（nginx、Cloudflare proxy 等）且想要零設定 HTTPS 時使用。

如果你已有反向代理處理 SSL，使用標準的 `docker compose up -d`（不帶 `ssl` profile）即可。
:::

::: warning 前置條件
- 連接埠 80 和 443 必須開放且未被其他程式佔用
- 你的網域必須指向伺服器的公開 IP（DNS A 記錄）
- Cloudflare 使用者：請使用僅 DNS 模式（灰雲），不要使用代理模式（橙雲）
:::

### 外部反向代理

如果你偏好自行管理 SSL，使用標準的 `docker compose up -d`（不帶 `ssl` profile），搭配以下任一方案。

#### Nginx 設定

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

#### Traefik 設定

```yaml
# docker-compose.traefik.yml
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
docker compose up -d --scale backend=3
```

## 監控

### 服務狀態檢查

```bash
# 檢查所有服務
docker compose ps

# 檢查資料庫連線
docker compose exec postgres pg_isready -U postgres
```

### 日誌

```bash
# 查看所有日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f backend

# 查看最後 100 行
docker compose logs --tail=100 backend
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
docker compose exec postgres pg_dump -U postgres open_short_url > backup_$(date +%Y%m%d).sql

# 自動備份腳本
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres open_short_url | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 保留最近 7 天
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### 資料庫還原

```bash
# 從備份還原
cat backup_20250115.sql | docker compose exec -T postgres psql -U postgres open_short_url

# 從壓縮備份還原
gunzip -c backup_20250115.sql.gz | docker compose exec -T postgres psql -U postgres open_short_url
```

### Redis 備份

```bash
# 建立快照
docker compose exec redis redis-cli BGSAVE

# 複製備份檔案
docker compose cp redis:/data/dump.rdb ./redis_backup.rdb
```

## 更新

### 從原始碼建置方式更新

```bash
# 拉取最新原始碼
git pull

# 重新建置並啟動
docker compose up -d --build
```

後端啟動時會自動執行資料庫遷移，無需手動操作。

### 使用預建映像檔方式更新

```bash
# 拉取最新映像檔
docker compose pull

# 使用新映像檔重啟
docker compose up -d
```

### 回滾

```bash
# 使用特定版本的映像檔
docker pull ghcr.io/supra126/open-short-url-backend:v1.0.0
docker pull ghcr.io/supra126/open-short-url-frontend:v1.0.0
docker compose up -d
```

## 疑難排解

### 常見問題

**容器無法啟動：**
```bash
# 檢查日誌
docker compose logs backend

# 檢查容器狀態
docker compose ps
```

**資料庫連線失敗：**
```bash
# 檢查 postgres 是否健康
docker compose exec postgres pg_isready -U postgres

# 從後端檢查連線
docker compose exec backend nc -zv postgres 5432
```

**權限被拒：**
```bash
# 修復 volume 權限
sudo chown -R 1000:1000 ./data
```

### 重置所有

```bash
# 停止所有容器
docker compose down

# 移除 volumes（警告：會刪除所有資料）
docker compose down -v

# 重新開始
docker compose up -d
```

## 安全檢查清單

- [ ] 變更預設資料庫密碼（`POSTGRES_PASSWORD`）
- [ ] 產生強 JWT 密鑰（`JWT_SECRET`）
- [ ] 設定安全的管理員初始密碼（`ADMIN_INITIAL_PASSWORD`）
- [ ] 啟用 HTTPS 並使用有效憑證
- [ ] 設定防火牆規則（僅開放 80/443 連接埠）
- [ ] 設定定期備份
- [ ] 啟用日誌輪替
- [ ] 保持映像檔更新

## 下一步

- [自建部署](/zh-TW/deployment/self-hosted) - 手動部署
- [設定](/zh-TW/guide/configuration) - 進階設定
- [API Keys](/zh-TW/features/api-keys) - 程式化存取
