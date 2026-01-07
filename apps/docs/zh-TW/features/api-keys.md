# API Keys

使用 API 金鑰程式化驗證 API 請求。

## 概覽

API 金鑰讓您無需使用 session 驗證即可程式化存取 Open Short URL 的 API。用於整合、自動化和第三方應用程式。

## 建立 API 金鑰

### 建立新金鑰

```json
POST /api/api-keys

{
  "name": "行動 App 整合",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**參數：**

| 參數 | 說明 | 必填 | 預設值 |
|-----|------|:----:|--------|
| `name` | 描述性名稱 | ✅ | - |
| `expiresAt` | 過期日期（ISO 8601） | ❌ | 永不過期 |

**回應：**

```json
{
  "id": "key_123",
  "name": "行動 App 整合",
  "key": "osu_a1b2c3d4e5f6g7h8i9j0...",
  "prefix": "osu_a1b2",
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

::: warning
完整的 API 金鑰只會在建立時顯示一次。請安全儲存！
:::

## 使用 API 金鑰

### 驗證標頭

在請求中包含 API 金鑰：

**選項 1：Bearer Token**
```
Authorization: Bearer osu_a1b2c3d4e5f6g7h8i9j0...
```

**選項 2：X-API-Key 標頭**
```
X-API-Key: osu_a1b2c3d4e5f6g7h8i9j0...
```

### 請求範例

**建立短網址：**

```bash
curl -X POST https://api.yourdomain.com/api/urls \
  -H "Authorization: Bearer osu_a1b2c3d4e5f6g7h8..." \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com"}'
```

**取得分析資料：**

```bash
curl https://api.yourdomain.com/api/analytics/overview \
  -H "X-API-Key: osu_a1b2c3d4e5f6g7h8..."
```

## 管理 API 金鑰

### 列出所有金鑰

```
GET /api/api-keys
```

**回應：**

```json
{
  "apiKeys": [
    {
      "id": "key_123",
      "name": "行動 App 整合",
      "prefix": "osu_a1b2",
      "expiresAt": "2025-12-31T23:59:59Z",
      "createdAt": "2025-01-15T10:00:00Z",
      "lastUsedAt": "2025-01-15T12:30:00Z"
    },
    {
      "id": "key_456",
      "name": "CI/CD Pipeline",
      "prefix": "osu_x9y8",
      "expiresAt": null,
      "createdAt": "2025-01-10T08:00:00Z",
      "lastUsedAt": "2025-01-15T09:15:00Z"
    }
  ],
  "total": 2
}
```

::: info
建立後永遠不會返回完整的 API 金鑰。只會顯示前綴。
:::

### 取得單一金鑰

```
GET /api/api-keys/{id}
```

### 刪除金鑰

```
DELETE /api/api-keys/{id}
```

刪除的金鑰會立即失效。

## 金鑰安全

### 儲存方式

API 金鑰以安全方式儲存：
- 使用 bcrypt 雜湊
- SHA-256 索引以便快速查詢
- 原始金鑰從不儲存

### 金鑰格式

```
osu_<隨機字元>
```

- 前綴：`osu_`（Open Short URL）
- 長度：約 64 字元
- 字元：英數字

### 過期

金鑰可設定過期：
- 建立時設定 `expiresAt`
- 過期金鑰返回 401 Unauthorized
- 不自動清理（需手動刪除）

## 權限

### API 金鑰範圍

API 金鑰具有與建立者相同的權限：

| 使用者角色 | API 金鑰存取權 |
|-----------|---------------|
| Admin | 完整存取所有端點 |
| User | 僅能存取自己的資源 |

### 支援的端點

所有 `/api/*` 端點支援 API 金鑰驗證：

- 網址管理（`/api/urls/*`）
- 分析（`/api/analytics/*`）
- 分組（`/api/bundles/*`）
- Webhooks（`/api/webhooks/*`）
- A/B 測試（`/api/urls/*/variants/*`）
- 路由規則（`/api/urls/*/routing-rules/*`）

## 速率限制

| 操作 | 限制 |
|-----|------|
| API 金鑰建立 | 5 次/分鐘 |
| API 請求（使用金鑰） | 與使用者限制相同 |

### 每使用者限制

| 設定 | 預設值 |
|-----|--------|
| 每使用者最大 API 金鑰數 | 10 |

透過 `MAX_API_KEYS_PER_USER` 環境變數設定。

## 最佳實踐

### 1. 使用描述性名稱

依用途命名金鑰：
- ✅ 「Production 後端伺服器」
- ✅ 「GitHub Actions CI/CD」
- ❌ 「API 金鑰 1」

### 2. 設定過期日期

盡可能使用會過期的金鑰：
- 定期輪換金鑰
- 限制洩漏金鑰的損害
- 設定合理的有效期

### 3. 每個整合一個金鑰

為每個使用案例建立獨立金鑰：
- 行動 app → 專用金鑰
- CI/CD → 專用金鑰
- 第三方服務 → 專用金鑰

### 4. 安全儲存

絕不暴露金鑰：
- 使用環境變數
- 不要提交到版本控制
- 在 production 使用 secrets manager

**範例（Node.js）：**

```javascript
// ✅ 好 - 從環境變數
const apiKey = process.env.OPEN_SHORT_URL_API_KEY;

// ❌ 壞 - 硬編碼
const apiKey = 'osu_a1b2c3d4...';
```

### 5. 監控使用

追蹤金鑰使用：
- 定期檢查 `lastUsedAt`
- 刪除未使用的金鑰
- 調查異常活動

### 6. 定期輪換

定期更換金鑰：
1. 建立新金鑰
2. 更新整合
3. 刪除舊金鑰

## 錯誤處理

### 驗證錯誤

| 狀態 | 錯誤 | 說明 |
|-----|------|------|
| 401 | Unauthorized | 缺少或無效的金鑰 |
| 401 | Key Expired | API 金鑰已過期 |
| 403 | Forbidden | 金鑰缺少權限 |

### 錯誤回應範例

```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

## 整合範例

### Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.yourdomain.com',
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`
  }
});

// 建立短網址
const response = await client.post('/api/urls', {
  originalUrl: 'https://example.com/page'
});
```

### Python

```python
import requests
import os

headers = {
    'Authorization': f'Bearer {os.environ["API_KEY"]}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://api.yourdomain.com/api/urls',
    headers=headers,
    json={'originalUrl': 'https://example.com/page'}
)
```

### cURL

```bash
export API_KEY="osu_a1b2c3d4..."

curl -X POST https://api.yourdomain.com/api/urls \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com/page"}'
```

## 使用案例

### CI/CD 整合

在部署流程中自動建立網址：

```yaml
# GitHub Actions 範例
- name: 為部署建立短網址
  run: |
    curl -X POST ${{ secrets.API_URL }}/api/urls \
      -H "Authorization: Bearer ${{ secrets.API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"originalUrl": "${{ env.DEPLOY_URL }}", "customSlug": "deploy-${{ github.sha }}"}'
```

### 行動 App

從您的 app 建立動態連結：

```swift
// Swift 範例
var request = URLRequest(url: apiURL)
request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
```

### 後端服務

與現有系統整合：

```javascript
// Express middleware
app.post('/share', async (req, res) => {
  const shortUrl = await createShortUrl(req.body.url);
  res.json({ shortUrl });
});
```

## 下一步

- [Webhooks](/zh-TW/features/webhooks) - 即時通知
- [API 參考](/zh-TW/api/reference) - 完整 API 文檔
- [稽核日誌](/zh-TW/features/audit-logs) - 追蹤 API 使用
