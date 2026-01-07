# 安裝

Open Short URL 正式環境的完整安裝指南。

## 系統需求

### 最低需求

| 元件 | 最低 | 建議 |
|------|------|------|
| **CPU** | 1 核心 | 2+ 核心 |
| **記憶體** | 1 GB | 2+ GB |
| **儲存空間** | 5 GB | 20+ GB |
| **Node.js** | 22.x | 最新 LTS |
| **PostgreSQL** | 15.x | 16.x |
| **Redis** | 7.x | 最新穩定版 |

### 支援平台

- Linux (Ubuntu 22.04+, Debian 12+, CentOS 9+)
- macOS (13+)
- Windows (建議使用 WSL2)
- Docker (任何平台)

## 安裝方式

### 方式一：從原始碼安裝（推薦）

最適合自訂和開發。

#### 步驟 1：複製儲存庫

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

#### 步驟 2：安裝依賴

```bash
# 如未安裝 pnpm，請先安裝
npm install -g pnpm@9

# 安裝專案依賴
pnpm install
```

#### 步驟 3：設定環境變數

```bash
# 複製範例環境檔案
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

編輯環境檔案填入正式環境的值。詳見 [設定指南](/zh-TW/guide/configuration)。

#### 步驟 4：設定資料庫

```bash
# 建立資料庫（PostgreSQL）
createdb open_short_url

# 產生 Prisma 客戶端
pnpm prisma:generate

# 執行遷移
pnpm --filter backend prisma migrate deploy

# （選用）填入初始資料
pnpm --filter backend db:seed-if-empty
```

#### 步驟 5：建置正式版本

```bash
pnpm build
```

#### 步驟 6：啟動正式伺服器

```bash
pnpm start
```

### 方式二：Docker

最適合快速部署與隔離。詳見 [Docker 部署](/zh-TW/deployment/docker)。

```bash
# 複製儲存庫
git clone https://github.com/supra126/open-short-url.git
cd open-short-url

# 使用 Docker Compose 啟動
docker-compose up -d
```

### 方式三：Railway（一鍵部署）

最適合無需管理基礎設施的託管服務。

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/open-short-url)

Railway 會自動配置：
- PostgreSQL 資料庫
- Redis 實例
- 環境變數

## 資料庫設定

### PostgreSQL 安裝

#### Ubuntu/Debian

```bash
# 安裝 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 啟動服務
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 建立資料庫和使用者
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

### Redis 安裝

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

### 驗證資料庫連線

```bash
# 測試 PostgreSQL
psql -U shorturl -d open_short_url -c "SELECT 1"

# 測試 Redis
redis-cli ping
# 預期：PONG
```

## 程序管理

### 使用 PM2（推薦）

PM2 提供程序管理、監控和自動重啟功能。

```bash
# 全域安裝 PM2
npm install -g pm2

# 啟動後端
pm2 start "pnpm start:backend" --name shorturl-backend

# 啟動前端
pm2 start "pnpm start:frontend" --name shorturl-frontend

# 儲存 PM2 設定
pm2 save

# 設定開機自動啟動
pm2 startup
```

#### PM2 指令

```bash
pm2 status              # 查看所有程序
pm2 logs                # 查看日誌
pm2 logs shorturl-backend  # 查看特定日誌
pm2 restart all         # 重啟所有程序
pm2 stop all            # 停止所有程序
pm2 delete all          # 移除所有程序
```

### 使用 systemd

建立 systemd 服務檔案進行管理。

#### 後端服務

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

#### 前端服務

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

#### 啟用服務

```bash
sudo systemctl daemon-reload
sudo systemctl enable shorturl-backend shorturl-frontend
sudo systemctl start shorturl-backend shorturl-frontend
```

## 反向代理設定

### Nginx 設定

```bash
sudo nano /etc/nginx/sites-available/shorturl
```

```nginx
# 前端
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

# 後端 API + 短網址重導向
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
# 啟用網站
sudo ln -s /etc/nginx/sites-available/shorturl /etc/nginx/sites-enabled/

# 測試設定
sudo nginx -t

# 重新載入 Nginx
sudo systemctl reload nginx
```

### SSL 憑證（Let's Encrypt）

```bash
# 安裝 Certbot
sudo apt install certbot python3-certbot-nginx

# 取得憑證
sudo certbot --nginx -d app.yourdomain.com -d s.yourdomain.com

# 自動更新會自動設定
```

## 驗證

### 健康檢查

```bash
# 後端健康
curl https://s.yourdomain.com/health

# 前端可訪問性
curl -I https://app.yourdomain.com
```

### 測試短網址建立

1. 開啟 `https://app.yourdomain.com`
2. 使用管理員帳號登入
3. 建立測試短網址
4. 訪問 `https://s.yourdomain.com/test-slug`
5. 驗證重導向是否正常

## 更新

### 從原始碼更新

```bash
cd /opt/open-short-url

# 取得最新變更
git fetch origin
git pull origin main

# 安裝新依賴
pnpm install

# 執行遷移
pnpm --filter backend prisma migrate deploy

# 重新建置
pnpm build

# 重啟服務
pm2 restart all
# 或
sudo systemctl restart shorturl-backend shorturl-frontend
```

## 備份

### 資料庫備份

```bash
# 建立備份
pg_dump -U shorturl -d open_short_url > backup_$(date +%Y%m%d).sql

# 還原備份
psql -U shorturl -d open_short_url < backup_20250101.sql
```

### 自動備份

```bash
# 新增至 crontab
crontab -e
```

```
# 每日凌晨 2 點備份
0 2 * * * pg_dump -U shorturl -d open_short_url > /backups/shorturl_$(date +\%Y\%m\%d).sql
```

## 下一步

- [設定指南](/zh-TW/guide/configuration) - 設定所有選項
- [Docker 部署](/zh-TW/deployment/docker) - Docker 部署指南
- [自建部署](/zh-TW/deployment/self-hosted) - 進階自建部署
