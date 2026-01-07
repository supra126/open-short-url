# 設定

Open Short URL 完整設定參考。

## 環境變數檔案

- `apps/backend/.env` - 後端 API 設定
- `apps/frontend/.env.local` - 前端應用程式設定

---

## 後端設定

### 必要

這些變數必須設定，應用程式才能運作。

#### 環境

| 變數 | 說明 | 範例 |
|------|------|------|
| `NODE_ENV` | 環境模式 | `production` |

```bash
NODE_ENV=production
```

#### 資料庫

| 變數 | 說明 | 範例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串 | 見下方 |

```bash
# 連線池參數：
#   connection_limit: 最大連線數（開發: 10-15, 正式: 20-30）
#   pool_timeout: 連線池逾時秒數（預設: 10）
#   connect_timeout: 連線逾時秒數（預設: 5）
DATABASE_URL="postgresql://user:password@localhost:5432/open_short_url?schema=public&connection_limit=20"
```

#### 網址與網域

| 變數 | 說明 | 範例 |
|------|------|------|
| `SHORT_URL_DOMAIN` | 短網址網域 | `https://s.yourdomain.com` |
| `FRONTEND_URL` | 前端應用程式 URL | `https://app.yourdomain.com` |
| `CORS_ORIGIN` | 允許的 CORS 來源 | `https://app.yourdomain.com` |

```bash
SHORT_URL_DOMAIN="https://s.yourdomain.com"
FRONTEND_URL="https://app.yourdomain.com"
# 多個來源: https://app1.example.com,https://app2.example.com
CORS_ORIGIN="https://app.yourdomain.com"
```

#### 認證

| 變數 | 說明 | 範例 |
|------|------|------|
| `JWT_SECRET` | JWT 權杖簽署金鑰（至少 32 字元） | 隨機字串 |
| `ADMIN_INITIAL_PASSWORD` | 初始管理員帳號密碼 | 強密碼 |

```bash
# 使用以下指令產生: openssl rand -base64 32
JWT_SECRET="your-super-secure-random-string-at-least-32-characters"
ADMIN_INITIAL_PASSWORD="your-strong-admin-password"
```

::: warning 安全性
- 請務必使用加密安全的隨機字串作為 `JWT_SECRET`
- 首次登入後立即更改 `ADMIN_INITIAL_PASSWORD`
:::

---

### 建議

這些變數為可選，但正式環境強烈建議設定。

#### Redis 快取

未設定時會退回使用記憶體儲存（正式環境不建議）。

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `REDIS_HOST` | Redis 伺服器主機名稱 | `localhost` |
| `REDIS_PORT` | Redis 伺服器埠號 | `6379` |
| `REDIS_PASSWORD` | Redis 密碼 | - |
| `REDIS_DB` | Redis 資料庫編號 | `0` |

```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

#### 代理設定

如果在反向代理後方（nginx, Cloudflare 等）請啟用。

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `TRUSTED_PROXY` | 信任代理標頭 | `false` |

```bash
# 會從 X-Forwarded-For 和 X-Real-IP 標頭讀取用戶端 IP
TRUSTED_PROXY=true
```

::: warning
僅在信任您的代理時才啟用。否則攻擊者可能偽造 IP 位址。
:::

#### Cloudflare Turnstile（防機器人）

保護密碼保護的網址免受機器人攻擊。

| 變數 | 說明 |
|------|------|
| `TURNSTILE_SECRET_KEY` | Turnstile 密鑰 |
| `TURNSTILE_SITE_KEY` | Turnstile 網站金鑰 |

```bash
# 從此處取得金鑰: https://dash.cloudflare.com/turnstile
TURNSTILE_SECRET_KEY="0x..."
TURNSTILE_SITE_KEY="0x..."

# 測試金鑰（永遠通過）：
# Site Key:   1x00000000000000000000AA
# Secret Key: 1x0000000000000000000000000000000AA
```

#### Webhooks

| 變數 | 說明 |
|------|------|
| `WEBHOOK_SECRET_KEY` | 預設 Webhook 簽署金鑰 |

```bash
# 使用以下指令產生: openssl rand -hex 32
WEBHOOK_SECRET_KEY="your-webhook-secret"
```

---

### 可選

這些變數有合理的預設值，可依需求調整。

#### 伺服器

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `PORT` | 後端伺服器埠號 | `4101` |
| `HOST` | 伺服器綁定位址 | `0.0.0.0` |

```bash
PORT=4101
HOST=0.0.0.0
```

#### Cookie

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `COOKIE_DOMAIN` | 跨子網域認證的 Cookie 網域 | 自動偵測 |

```bash
# 跨子網域（api.example.com & app.example.com）: .example.com
# 單一網域或 localhost: 留空
COOKIE_DOMAIN=.example.com
```

#### 認證選項

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `JWT_EXPIRES_IN` | JWT 權杖過期時間 | `7d` |
| `BCRYPT_ROUNDS` | 密碼雜湊回合數 | `10` |

```bash
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS=10
```

#### 速率限制

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `THROTTLE_TTL` | 時間窗口（秒） | `60` |
| `THROTTLE_LIMIT` | 每個時間窗口最大請求數 | `10` |

```bash
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

#### 代碼產生

根據總網址數量動態調整代碼長度。

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `SLUG_LENGTH_THRESHOLDS` | 網址數量閾值 | `1000,50000,500000` |
| `SLUG_LENGTHS` | 對應的代碼長度 | `4,5,6,7` |

```bash
# 數量 < 1000         -> 4 字元
# 1000 <= 數量 < 50000   -> 5 字元
# 50000 <= 數量 < 500000 -> 6 字元
# 數量 >= 500000         -> 7 字元
SLUG_LENGTH_THRESHOLDS="1000,50000,500000"
SLUG_LENGTHS="4,5,6,7"
```

#### 品牌設定

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `BRAND_NAME` | 應用程式名稱 | `Open Short URL` |
| `BRAND_LOGO_URL` | Logo URL | - |

```bash
BRAND_NAME="我的短網址"
BRAND_LOGO_URL="https://example.com/logo.png"
```

#### API 金鑰

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `MAX_API_KEYS_PER_USER` | 每位使用者最大 API 金鑰數 | `10` |

```bash
MAX_API_KEYS_PER_USER=10
```

#### 數據分析

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `ANALYTICS_CACHE_TTL` | 快取 TTL（秒） | `300` |
| `ANALYTICS_TOP_URLS_LIMIT` | 總覽中熱門網址數量 | `10` |
| `ANALYTICS_RECENT_CLICKS_LIMIT` | 近期點擊限制 | `100` |
| `ANALYTICS_EXPORT_MAX_RECORDS` | 每次匯出最大記錄數 | `10000` |
| `ANALYTICS_EXPORT_BATCH_SIZE` | 匯出批次大小 | `1000` |
| `ANALYTICS_MAX_IN_MEMORY_CLICKS` | 記憶體處理最大點擊數 | `50000` |
| `ANALYTICS_AGGREGATION_THRESHOLD` | 資料庫聚合閾值 | `10000` |

```bash
ANALYTICS_CACHE_TTL=300
ANALYTICS_EXPORT_MAX_RECORDS=10000
```

#### 電子郵件（SMTP）

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `SMTP_HOST` | SMTP 伺服器主機 | - |
| `SMTP_PORT` | SMTP 伺服器埠號 | `587` |
| `SMTP_USER` | SMTP 使用者名稱 | - |
| `SMTP_PASSWORD` | SMTP 密碼 | - |
| `SMTP_FROM` | 預設寄件者地址 | - |

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@example.com"
```

---

## 前端設定

### 必要

#### 環境

| 變數 | 說明 | 範例 |
|------|------|------|
| `NODE_ENV` | 環境模式 | `production` |

```bash
NODE_ENV=production
```

#### API 連線

| 變數 | 說明 | 範例 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 後端 API URL | `https://s.yourdomain.com` |
| `NEXT_PUBLIC_SHORT_URL_DOMAIN` | 短網址網域 | `https://s.yourdomain.com` |

```bash
NEXT_PUBLIC_API_URL="https://s.yourdomain.com"
NEXT_PUBLIC_SHORT_URL_DOMAIN="https://s.yourdomain.com"
```

---

### 建議

#### Cloudflare Turnstile

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile 網站金鑰 |

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```

#### 品牌設定

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `NEXT_PUBLIC_BRAND_NAME` | 應用程式名稱 | `Open Short URL` |
| `NEXT_PUBLIC_BRAND_ICON_URL` | 品牌圖示 URL | - |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | 品牌描述 | - |

```bash
NEXT_PUBLIC_BRAND_NAME="我的短網址"
NEXT_PUBLIC_BRAND_ICON_URL="https://example.com/icon.png"
NEXT_PUBLIC_BRAND_DESCRIPTION="簡單易用的短網址服務"
```

---

### 可選

#### 國際化

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `NEXT_PUBLIC_LOCALE` | 預設語言 | `en` |

```bash
# 可用: en, zh-TW, pt-BR
NEXT_PUBLIC_LOCALE="zh-TW"
```

#### AI 功能

AI 預設為停用。至少設定一個供應商 API 金鑰即可啟用。

**設定：**

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `AI_PROVIDER` | AI 供應商 | - |
| `AI_MODEL` | AI 模型名稱 | - |
| `AI_TEMPERATURE` | 回應創意度（0.0-2.0） | `0.7` |
| `AI_MAX_TOKENS` | 回應最大 token 數 | `4096` |
| `AI_TOP_P` | Top-p 取樣（0.0-1.0） | `1.0` |

**供應商 API 金鑰：**

| 變數 | 供應商 |
|------|--------|
| `OPENAI_API_KEY` | GPT-4, GPT-3.5 |
| `ANTHROPIC_API_KEY` | Claude |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini |
| `MISTRAL_API_KEY` | Mistral |
| `COHERE_API_KEY` | Cohere |

```bash
AI_PROVIDER="anthropic"
AI_MODEL="claude-3-5-sonnet-20241022"
ANTHROPIC_API_KEY="sk-ant-..."
```

**Google Vertex AI：**

| 變數 | 說明 |
|------|------|
| `GOOGLE_VERTEX_PROJECT` | GCP 專案 ID |
| `GOOGLE_VERTEX_LOCATION` | GCP 區域 |
| `GOOGLE_APPLICATION_CREDENTIALS` | 服務帳號路徑 |

```bash
GOOGLE_VERTEX_PROJECT="your-gcp-project"
GOOGLE_VERTEX_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

---

## 完整範例

### 後端（.env）

```bash
# ============================================================
# 必要
# ============================================================
NODE_ENV=production
DATABASE_URL="postgresql://shorturl:password@localhost:5432/open_short_url?schema=public&connection_limit=20"
SHORT_URL_DOMAIN="https://s.yourdomain.com"
FRONTEND_URL="https://app.yourdomain.com"
CORS_ORIGIN="https://app.yourdomain.com"
JWT_SECRET="your-super-secure-random-string-at-least-32-characters"
ADMIN_INITIAL_PASSWORD="your-strong-admin-password"

# ============================================================
# 建議
# ============================================================
REDIS_HOST="localhost"
REDIS_PORT="6379"
TRUSTED_PROXY=true
# TURNSTILE_SECRET_KEY=""
# TURNSTILE_SITE_KEY=""
# WEBHOOK_SECRET_KEY=""

# ============================================================
# 可選
# ============================================================
PORT=4101
JWT_EXPIRES_IN="7d"
THROTTLE_TTL=60
THROTTLE_LIMIT=10
BRAND_NAME="我的短網址"
MAX_API_KEYS_PER_USER=10
ANALYTICS_CACHE_TTL=300
```

### 前端（.env.local）

```bash
# ============================================================
# 必要
# ============================================================
NODE_ENV=production
NEXT_PUBLIC_API_URL="https://s.yourdomain.com"
NEXT_PUBLIC_SHORT_URL_DOMAIN="https://s.yourdomain.com"

# ============================================================
# 建議
# ============================================================
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
NEXT_PUBLIC_BRAND_NAME="我的短網址"

# ============================================================
# 可選
# ============================================================
NEXT_PUBLIC_LOCALE="zh-TW"
# AI_PROVIDER="anthropic"
# AI_MODEL="claude-3-5-sonnet-20241022"
# ANTHROPIC_API_KEY=""
```

---

## 安全性最佳實踐

1. **JWT Secret** - 使用至少 32 字元的隨機字串
2. **管理員密碼** - 使用強密碼，首次登入後立即更改
3. **資料庫** - 使用強密碼並限制存取
4. **CORS** - 只允許您的前端網域
5. **HTTPS** - 正式環境務必使用 HTTPS
6. **代理** - 只在信任的代理後方啟用 `TRUSTED_PROXY`
7. **環境變數檔案** - 永遠不要將 `.env` 檔案提交到 git
8. **API 金鑰** - 定期輪換 API 金鑰

## 下一步

- [短網址](/zh-TW/features/url-shortening) - 網址管理功能
- [數據分析](/zh-TW/features/analytics) - 分析設定
- [API 參考](/zh-TW/api/reference) - API 文件
