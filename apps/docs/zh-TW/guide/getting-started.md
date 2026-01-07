# 快速開始

幾分鐘內啟動並執行 Open Short URL。

## 前置需求

開始之前，請確保您已安裝：

| 需求 | 版本 | 備註 |
|------|------|------|
| Node.js | 22+ | 建議使用 LTS 版本 |
| pnpm | 9+ | 套件管理器 |
| PostgreSQL | 15+ | 主要資料庫 |
| Redis | 7+ | 快取層（開發可選，正式環境建議） |

## 快速入門

### 1. 複製儲存庫

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

### 2. 安裝依賴

```bash
pnpm install
```

### 3. 設定環境變數

複製範例環境檔案：

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

編輯 `apps/backend/.env` 填入您的資料庫設定：

```bash
# 資料庫（必填）
DATABASE_URL="postgresql://user:password@localhost:5432/open_short_url"

# Redis（開發可選，正式環境建議）
REDIS_HOST="localhost"
REDIS_PORT="6379"

# 安全性（必填 - 產生一個安全的隨機字串）
JWT_SECRET="your-secure-random-string-at-least-32-chars"

# 網址（必填）
SHORT_URL_DOMAIN="http://localhost:4101"
FRONTEND_URL="http://localhost:4100"
CORS_ORIGIN="http://localhost:4100"
```

### 4. 設定資料庫

產生 Prisma 客戶端並執行資料庫遷移：

```bash
# 產生 Prisma 客戶端
pnpm prisma:generate

# 執行資料庫遷移
pnpm prisma:migrate
```

### 5. 啟動開發伺服器

```bash
pnpm dev
```

應用程式將在以下位址啟動：

| 服務 | 網址 |
|------|------|
| 前端 | http://localhost:4100 |
| 後端 API | http://localhost:4101 |
| Swagger UI | http://localhost:4101/api |

### 6. 建立您的第一個短網址

1. 在瀏覽器開啟 http://localhost:4100
2. 註冊新帳號或登入
3. 點擊「建立新網址」
4. 輸入長網址，並可選擇自訂短碼
5. 點擊「建立」- 您的短網址已準備就緒！

## 預設帳號

如果啟用了種子資料，可使用以下帳號：

| 角色 | 電子郵件 | 密碼 |
|------|----------|------|
| 管理員 | admin@example.com | Admin123! |

::: warning
請在正式環境中立即更改預設帳號密碼！
:::

## 專案結構

```
open-short-url/
├── apps/
│   ├── backend/          # NestJS API 伺服器
│   │   ├── src/
│   │   │   ├── auth/     # 認證模組
│   │   │   ├── url/      # 網址管理
│   │   │   ├── analytics/# 數據分析模組
│   │   │   └── ...
│   │   └── prisma/       # 資料庫結構
│   ├── frontend/         # Next.js 網頁應用
│   │   ├── src/
│   │   │   ├── app/      # App router 頁面
│   │   │   ├── components/
│   │   │   └── lib/      # 工具與 API
│   │   └── ...
│   └── docs/             # 文檔（本網站）
├── packages/
│   └── mcp/              # MCP 整合
└── package.json          # 根工作區設定
```

## 可用指令

| 指令 | 說明 |
|------|------|
| `pnpm dev` | 以開發模式啟動所有服務 |
| `pnpm dev:backend` | 僅啟動後端 |
| `pnpm dev:frontend` | 僅啟動前端 |
| `pnpm build` | 建置正式版本 |
| `pnpm prisma:studio` | 開啟 Prisma Studio（資料庫 GUI） |
| `pnpm prisma:migrate` | 執行資料庫遷移 |
| `pnpm lint` | 執行所有套件的程式碼檢查 |
| `pnpm type-check` | 執行 TypeScript 類型檢查 |

## 驗證安裝

### 檢查後端健康狀態

```bash
curl http://localhost:4101/health
```

預期回應：
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 存取 Swagger 文檔

在瀏覽器開啟 http://localhost:4101/api 瀏覽 API 文檔。

## 常見問題

### 資料庫連線失敗

```
Error: P1001: Can't reach database server
```

**解決方案：**
- 確認 PostgreSQL 正在執行
- 驗證 `.env` 中的 `DATABASE_URL`
- 檢查防火牆設定

### Redis 連線失敗

```
Error: ECONNREFUSED 127.0.0.1:6379
```

**解決方案：**
- 確認 Redis 正在執行
- 驗證 `.env` 中的 `REDIS_HOST` 和 `REDIS_PORT`

### 連接埠已被使用

```
Error: EADDRINUSE: address already in use
```

**解決方案：**
- 在 `.env` 中修改連接埠（例如 `PORT=4102`）
- 停止衝突的服務

### Prisma 客戶端未產生

```
Error: @prisma/client did not initialize yet
```

**解決方案：**
```bash
pnpm prisma:generate
```

## 下一步

現在 Open Short URL 已經運行，您可以：

1. [安裝指南](/zh-TW/guide/installation) - 正式環境安裝
2. [設定指南](/zh-TW/guide/configuration) - 進階設定選項
3. [短網址功能](/zh-TW/features/url-shortening) - 了解網址功能
4. [數據分析](/zh-TW/features/analytics) - 探索分析功能
5. [API 參考](/zh-TW/api/reference) - 透過 API 整合
