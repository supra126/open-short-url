# 稽核日誌

透過全面的稽核日誌追蹤所有系統活動。

## 概覽

稽核日誌記錄您 Open Short URL 實例中的所有重要操作，提供完整的歷史記錄，包括誰在何時何地做了什麼。對於安全合規和問題排查至關重要。

## 存取稽核日誌

::: warning
稽核日誌僅供 **Admin** 使用者存取。
:::

### 查詢日誌

```
GET /api/audit-logs?page=1&pageSize=20
```

**查詢參數：**

| 參數 | 說明 | 預設值 |
|-----|------|--------|
| `page` | 頁碼 | 1 |
| `pageSize` | 每頁數量 | 20 |
| `action` | 依操作類型篩選 | - |
| `entityType` | 依實體類型篩選 | - |
| `userId` | 依使用者篩選 | - |
| `startDate` | 開始日期（ISO 8601） | - |
| `endDate` | 結束日期（ISO 8601） | - |
| `sortBy` | 排序欄位 | `createdAt` |
| `sortOrder` | 排序方向 | `desc` |

### 回應範例

```json
{
  "logs": [
    {
      "id": "log_123",
      "userId": "user_456",
      "action": "URL_CREATED",
      "entityType": "url",
      "entityId": "url_789",
      "oldValue": null,
      "newValue": {
        "slug": "my-link",
        "originalUrl": "https://example.com"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "requestId": "req_abc123"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

## 追蹤的操作

### 網址操作

| 操作 | 說明 |
|-----|------|
| `URL_CREATED` | 建立短網址 |
| `URL_UPDATED` | 更新短網址 |
| `URL_DELETED` | 刪除短網址 |
| `URL_BULK_CREATED` | 批量建立網址 |
| `URL_BULK_UPDATED` | 批量更新網址 |
| `URL_BULK_DELETED` | 批量刪除網址 |

### 使用者操作

| 操作 | 說明 |
|-----|------|
| `USER_LOGIN` | 使用者登入 |
| `USER_LOGOUT` | 使用者登出 |
| `USER_CREATED` | 建立新使用者 |
| `USER_UPDATED` | 更新使用者資料 |
| `USER_DELETED` | 刪除使用者 |
| `PASSWORD_CHANGED` | 變更密碼 |
| `TWO_FACTOR_ENABLED` | 啟用雙因素驗證 |
| `TWO_FACTOR_DISABLED` | 停用雙因素驗證 |

### API 金鑰操作

| 操作 | 說明 |
|-----|------|
| `API_KEY_CREATED` | 建立 API 金鑰 |
| `API_KEY_DELETED` | 刪除 API 金鑰 |

### A/B 測試操作

| 操作 | 說明 |
|-----|------|
| `VARIANT_CREATED` | 建立 A/B 測試變體 |
| `VARIANT_UPDATED` | 更新變體 |
| `VARIANT_DELETED` | 刪除變體 |

### 分組操作

| 操作 | 說明 |
|-----|------|
| `BUNDLE_CREATED` | 建立分組 |
| `BUNDLE_UPDATED` | 更新分組 |
| `BUNDLE_DELETED` | 刪除分組 |

### Webhook 操作

| 操作 | 說明 |
|-----|------|
| `WEBHOOK_CREATED` | 建立 Webhook |
| `WEBHOOK_UPDATED` | 更新 Webhook |
| `WEBHOOK_DELETED` | 刪除 Webhook |

### 路由操作

| 操作 | 說明 |
|-----|------|
| `ROUTING_RULE_CREATED` | 建立路由規則 |
| `ROUTING_RULE_UPDATED` | 更新路由規則 |
| `ROUTING_RULE_DELETED` | 刪除路由規則 |

### 系統操作

| 操作 | 說明 |
|-----|------|
| `SETTINGS_UPDATED` | 變更系統設定 |

## 實體類型

| 實體類型 | 說明 |
|---------|------|
| `url` | 短網址 |
| `user` | 使用者帳號 |
| `api_key` | API 金鑰 |
| `bundle` | 網址分組 |
| `webhook` | Webhook 設定 |
| `variant` | A/B 測試變體 |
| `routing_rule` | 智慧路由規則 |
| `settings` | 系統設定 |

## 日誌欄位

### 核心欄位

| 欄位 | 說明 |
|-----|------|
| `id` | 唯一日誌 ID |
| `userId` | 執行操作的使用者 |
| `action` | 操作類型（見上方） |
| `entityType` | 受影響的實體類型 |
| `entityId` | 受影響實體的 ID |
| `createdAt` | 操作發生時間 |

### 變更追蹤

| 欄位 | 說明 |
|-----|------|
| `oldValue` | 之前的狀態（JSON） |
| `newValue` | 新的狀態（JSON） |

**變更範例：**

```json
{
  "action": "URL_UPDATED",
  "oldValue": {
    "title": "舊標題",
    "status": "ACTIVE"
  },
  "newValue": {
    "title": "新標題",
    "status": "INACTIVE"
  }
}
```

### 請求上下文

| 欄位 | 說明 |
|-----|------|
| `ipAddress` | 客戶端 IP 位址 |
| `userAgent` | 客戶端 User Agent |
| `metadata` | 額外上下文 |

**Metadata 範例：**

```json
{
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/urls"
}
```

## 篩選範例

### 依操作類型

```
GET /api/audit-logs?action=URL_CREATED
```

### 依實體類型

```
GET /api/audit-logs?entityType=url
```

### 依使用者

```
GET /api/audit-logs?userId=user_123
```

### 依日期範圍

```
GET /api/audit-logs?startDate=2025-01-01&endDate=2025-01-31
```

### 組合篩選

```
GET /api/audit-logs?action=URL_CREATED&userId=user_123&startDate=2025-01-01
```

## 使用案例

### 安全監控

追蹤可疑活動：

```
GET /api/audit-logs?action=USER_LOGIN&sortOrder=desc
```

注意：
- 失敗的登入嘗試
- 來自異常位置的登入
- 非工作時間的活動

### 變更稽核

檢視誰修改了什麼：

```
GET /api/audit-logs?entityType=url&entityId=url_123
```

查看特定網址的完整歷史記錄。

### 合規報告

產生合規報告：

```
GET /api/audit-logs?startDate=2025-01-01&endDate=2025-03-31&pageSize=1000
```

匯出一季的所有活動。

### 問題排查

透過追蹤操作來除錯問題：

```
GET /api/audit-logs?entityId=url_123&sortBy=createdAt&sortOrder=asc
```

查看時間順序的歷史記錄。

## 日誌保留

### 預設行為

稽核日誌預設永久保留。

### 建議做法

1. **定期匯出** - 將日誌封存以供長期儲存
2. **設定保留政策** - 定義日誌保留時間
3. **監控成長** - 追蹤資料庫大小

## 最佳實踐

### 1. 定期檢視

定期檢查稽核日誌：
- 關鍵系統每日檢視
- 一般監控每週檢視
- 安全事件後檢視

### 2. 設定警報

與監控系統整合：
- 使用 webhooks 即時警報
- 追蹤敏感操作
- 監控異常

### 3. 匯出備份

維護外部備份：
- 每月/每季匯出
- 儲存在安全位置
- 依合規要求保留

### 4. 限制存取

限制稽核日誌存取：
- 僅限 Admin 使用者
- 檢視誰有 Admin 存取權
- 記錄對稽核日誌的存取

## 安全考量

### 記錄的內容

稽核日誌記錄：
- 誰（userId）
- 什麼（action、entity）
- 何時（timestamp）
- 何處（IP、user agent）
- 變更（old/new values）

### 不記錄的內容

為了隱私和安全：
- 密碼（從不儲存）
- 完整 API 金鑰（僅前綴）
- 敏感請求內容

### IP 位址隱私

記錄 IP 位址是為了安全：
- 可能被視為個人資料（GDPR）
- 依需要實施保留政策
- 如需要可匿名化

## 整合

### 匯出到 SIEM

將日誌發送到安全平台：

```javascript
// 範例：匯出到 Splunk
const logs = await fetchAuditLogs();
await sendToSplunk(logs);
```

### Webhook 整合

結合 webhooks 取得即時稽核通知（需要自訂實作）。

## 下一步

- [API Keys](/zh-TW/features/api-keys) - 管理 API 存取
- [Webhooks](/zh-TW/features/webhooks) - 即時通知
- [API 參考](/zh-TW/api/reference) - 完整 API 文檔
