# API 參考

Open Short URL 完整的 REST API 文檔。

## 概覽

Open Short URL 提供完整的 REST API，可程式化存取所有功能。

**Base URL:** `https://your-domain.com/api`

**互動式文檔:** 執行後端時，可在 `/api` 存取 Swagger UI。

## 認證方式

### JWT 認證（推薦用於 Web 應用程式）

1. 透過 `POST /api/auth/login` 登入 - token 儲存在 httpOnly cookie
2. JWT token 會自動透過 cookie 發送

### API Key 認證（推薦用於伺服器對伺服器）

1. 透過 `POST /api/api-keys` 建立 API Key
2. 在請求標頭中加入：`X-API-Key: <your-api-key>`

---

## 認證 API

### 登入

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"  // 選填，啟用 2FA 時必填
}
```

**回應：**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "USER"
  },
  "accessToken": "jwt_token"
}
```

### 登出

```http
POST /api/auth/logout
```

### 取得目前使用者

```http
GET /api/auth/me
```

### 變更密碼

```http
POST /api/auth/password
Content-Type: application/json

{
  "currentPassword": "舊密碼",
  "newPassword": "新密碼"
}
```

### 雙因素認證

```http
# 設定 2FA
POST /api/auth/2fa/setup

# 啟用 2FA
POST /api/auth/2fa/enable
{
  "code": "123456"
}

# 停用 2FA
POST /api/auth/2fa/disable
{
  "code": "123456",
  "password": "your_password"
}
```

---

## 短網址 API

### 建立短網址

```http
POST /api/urls
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url",
  "customSlug": "my-link",           // 選填，3-50 字元
  "title": "我的連結",                // 選填
  "password": "secret",              // 選填，最少 4 字元
  "expiresAt": "2025-12-31T23:59:59Z", // 選填，ISO 8601 格式
  "utmSource": "newsletter",         // 選填
  "utmMedium": "email",              // 選填
  "utmCampaign": "summer_sale",      // 選填
  "utmTerm": "discount",             // 選填
  "utmContent": "banner_top"         // 選填
}
```

### 列出網址

```http
GET /api/urls?page=1&limit=10&search=keyword&status=ACTIVE
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `page` | number | 頁碼（預設：1） |
| `limit` | number | 每頁數量（預設：10） |
| `search` | string | 搜尋標題和網址 |
| `status` | string | 篩選狀態：`ACTIVE`、`INACTIVE` |
| `sortBy` | string | 排序欄位 |
| `sortOrder` | string | `asc` 或 `desc` |

### 取得網址詳情

```http
GET /api/urls/{id}
```

### 更新網址

```http
PATCH /api/urls/{id}
Content-Type: application/json

{
  "title": "更新的標題",
  "status": "ACTIVE",
  "password": "new_password",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

### 刪除網址

```http
DELETE /api/urls/{id}
```

### 取得網址統計

```http
GET /api/urls/stats
```

### 產生 QR Code

```http
GET /api/urls/{id}/qrcode?width=300&color=%23000000
```

### 批量操作

```http
# 批量建立
POST /api/urls/bulk
Content-Type: application/json

{
  "urls": [
    { "originalUrl": "https://example1.com" },
    { "originalUrl": "https://example2.com", "customSlug": "ex2" }
  ]
}

# 批量更新狀態
PATCH /api/urls/bulk
{
  "urlIds": ["id1", "id2"],
  "status": "INACTIVE"
}

# 批量刪除
DELETE /api/urls/bulk
{
  "urlIds": ["id1", "id2"]
}
```

---

## A/B 測試（變體）

### 建立變體

```http
POST /api/urls/{id}/variants
Content-Type: application/json

{
  "name": "變體 A",
  "targetUrl": "https://example.com/page-v1",
  "weight": 50,
  "isActive": true
}
```

### 列出變體

```http
GET /api/urls/{id}/variants
```

### 更新變體

```http
PATCH /api/urls/{id}/variants/{variantId}
Content-Type: application/json

{
  "name": "更新的變體",
  "weight": 30,
  "isActive": false
}
```

### 刪除變體

```http
DELETE /api/urls/{id}/variants/{variantId}
```

---

## 數據分析 API

### 取得網址分析

```http
GET /api/analytics/urls/{id}?startDate=2025-01-01&endDate=2025-01-31&timezone=Asia/Taipei
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `startDate` | string | 開始日期（ISO 8601） |
| `endDate` | string | 結束日期（ISO 8601） |
| `timezone` | string | 時區（例如 `Asia/Taipei`） |

### 取得總覽分析

```http
GET /api/analytics/overview?startDate=2025-01-01&endDate=2025-01-31
```

### 取得熱門網址

```http
GET /api/analytics/top-urls?limit=10
```

### 取得最近點擊

```http
GET /api/analytics/urls/{id}/recent-clicks?limit=20&includeBots=false
```

### 取得機器人分析

```http
GET /api/analytics/urls/{id}/bots
GET /api/analytics/bots  # 整體機器人分析
```

### 取得 A/B 測試分析

```http
GET /api/analytics/ab-tests
```

### 匯出分析資料

```http
GET /api/analytics/urls/{id}/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
GET /api/analytics/export?format=json  # 匯出全部
```

**匯出格式：** `csv`、`json`

---

## 網址分組 API

### 建立分組

```http
POST /api/bundles
Content-Type: application/json

{
  "name": "行銷活動",
  "description": "2025 Q1 活動連結",
  "color": "#FF5733",
  "icon": "🎯",
  "urlIds": ["url_id_1", "url_id_2"]
}
```

### 列出分組

```http
GET /api/bundles?page=1&limit=10&search=campaign&status=ACTIVE
```

### 取得分組詳情

```http
GET /api/bundles/{id}
```

### 更新分組

```http
PATCH /api/bundles/{id}
Content-Type: application/json

{
  "name": "更新的名稱",
  "color": "#3B82F6"
}
```

### 刪除分組

```http
DELETE /api/bundles/{id}
```

### 封存 / 還原分組

```http
POST /api/bundles/{id}/archive
POST /api/bundles/{id}/restore
```

### 取得分組統計

```http
GET /api/bundles/{id}/stats
```

### 管理分組網址

```http
# 新增單一網址
POST /api/bundles/{id}/urls
{ "urlId": "url_id" }

# 新增多個網址
POST /api/bundles/{id}/urls/batch
{ "urlIds": ["url_id_1", "url_id_2"] }

# 移除網址
DELETE /api/bundles/{id}/urls/{urlId}

# 更新網址順序
PATCH /api/bundles/{id}/urls/{urlId}/order
{ "order": 2 }
```

---

## API Key 管理

### 建立 API Key

```http
POST /api/api-keys
Content-Type: application/json

{
  "name": "正式伺服器",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**回應僅顯示一次金鑰：**
```json
{
  "id": "key_id",
  "name": "正式伺服器",
  "key": "osu_xxxxxxxxxxxxxxxx",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### 列出 API Key

```http
GET /api/api-keys
```

### 刪除 API Key

```http
DELETE /api/api-keys/{id}
```

---

## Webhook API

### 建立 Webhook

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["url.clicked", "url.created"],
  "secret": "your_webhook_secret"
}
```

**可用事件：**
- `url.created`
- `url.updated`
- `url.deleted`
- `url.clicked`

### 列出 Webhook

```http
GET /api/webhooks
```

### 更新 Webhook

```http
PATCH /api/webhooks/{id}
```

### 刪除 Webhook

```http
DELETE /api/webhooks/{id}
```

### 測試 Webhook

```http
POST /api/webhooks/{id}/test
```

### 取得 Webhook 日誌

```http
GET /api/webhooks/{id}/logs
```

---

## 智慧路由規則

### 建立路由規則

```http
POST /api/urls/{urlId}/routing-rules
Content-Type: application/json

{
  "name": "行動裝置使用者",
  "targetUrl": "https://example.com/mobile",
  "priority": 1,
  "conditions": {
    "logicalOperator": "AND",
    "items": [
      {
        "type": "DEVICE",
        "operator": "EQUALS",
        "value": "MOBILE"
      }
    ]
  }
}
```

### 列出路由規則

```http
GET /api/urls/{urlId}/routing-rules
```

### 更新路由規則

```http
PATCH /api/urls/{urlId}/routing-rules/{ruleId}
```

### 刪除路由規則

```http
DELETE /api/urls/{urlId}/routing-rules/{ruleId}
```

### 取得路由範本

```http
GET /api/routing-templates
```

### 從範本建立規則

```http
POST /api/urls/{urlId}/routing-rules/from-template
{
  "templateId": "template_id",
  "targetUrl": "https://example.com/target"
}
```

---

## 使用者管理（管理員）

### 列出使用者

```http
GET /api/users?page=1&limit=10&search=email
```

### 建立使用者

```http
POST /api/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "USER"
}
```

### 更新使用者角色

```http
PATCH /api/users/{id}/role
{ "role": "ADMIN" }
```

### 更新使用者狀態

```http
PATCH /api/users/{id}/status
{ "status": "ACTIVE" }
```

### 重設使用者密碼

```http
POST /api/users/{id}/reset-password
{ "newPassword": "new_password" }
```

### 刪除使用者

```http
DELETE /api/users/{id}
```

---

## 稽核日誌（管理員）

### 列出稽核日誌

```http
GET /api/audit-logs?page=1&limit=20&action=LOGIN&startDate=2025-01-01
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `page` | number | 頁碼 |
| `limit` | number | 每頁數量 |
| `action` | string | 篩選動作類型 |
| `userId` | string | 篩選使用者 ID |
| `startDate` | string | 開始日期 |
| `endDate` | string | 結束日期 |

---

## 重新導向服務

### 重新導向至原始網址

```http
GET /{slug}
```

### 取得網址資訊

```http
GET /{slug}/info
```

### 驗證密碼

```http
POST /{slug}/verify
Content-Type: application/json

{
  "password": "連結密碼"
}
```

---

## 錯誤處理

所有錯誤遵循此格式：

```json
{
  "statusCode": 400,
  "message": "驗證失敗",
  "errors": [
    {
      "field": "originalUrl",
      "message": "無效的網址格式"
    }
  ]
}
```

**常見狀態碼：**
| 代碼 | 說明 |
|------|------|
| 200 | 成功 |
| 201 | 已建立 |
| 400 | 錯誤的請求 |
| 401 | 未認證 |
| 403 | 禁止存取 |
| 404 | 找不到資源 |
| 429 | 請求過多 |
| 500 | 內部伺服器錯誤 |

---

## 速率限制

- 預設：每分鐘 100 個請求
- 回應標頭中包含速率限制資訊：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
