# 數據分析

追蹤並分析您的短網址表現。

## 概覽

Open Short URL 為所有短網址提供全面的數據分析功能，包含即時點擊追蹤、地理位置資料、裝置資訊、來源追蹤等。

## 分析端點

### 整體概覽

```
GET /api/analytics/overview?startDate=2025-01-01&endDate=2025-01-31
```

**回應：**

```json
{
  "totalClicks": 15420,
  "uniqueVisitors": 12350,
  "totalUrls": 156,
  "clicksByDate": [
    { "date": "2025-01-01", "clicks": 520 },
    { "date": "2025-01-02", "clicks": 480 }
  ],
  "topUrls": [
    { "id": "url_123", "slug": "summer-sale", "clicks": 3200 }
  ]
}
```

### 單一網址分析

```
GET /api/analytics/urls/{id}?startDate=2025-01-01&endDate=2025-01-31
```

**回應：**

```json
{
  "urlId": "url_123",
  "totalClicks": 3200,
  "uniqueVisitors": 2850,
  "clicksByDate": [...],
  "geographic": {...},
  "devices": {...},
  "browsers": {...},
  "referrers": {...}
}
```

## 指標

### 點擊追蹤

| 指標 | 說明 |
|-----|------|
| 總點擊數 | 所有點擊總和 |
| 不重複訪客 | 依 IP 去重後的訪客數 |
| 點擊趨勢 | 每日/每週/每月點擊數 |

### 地理資料

```json
{
  "geographic": {
    "countries": [
      { "code": "TW", "name": "Taiwan", "clicks": 1200 },
      { "code": "US", "name": "United States", "clicks": 800 }
    ],
    "cities": [
      { "city": "Taipei", "country": "TW", "clicks": 650 },
      { "city": "New York", "country": "US", "clicks": 320 }
    ]
  }
}
```

**可用欄位：**

| 欄位 | 說明 |
|-----|------|
| `country` | 國家代碼（ISO 3166-1） |
| `region` | 州/省 |
| `city` | 城市 |
| `clicks` | 該位置的點擊數 |

### 裝置資訊

```json
{
  "devices": {
    "types": [
      { "type": "MOBILE", "clicks": 1800, "percentage": 56.25 },
      { "type": "DESKTOP", "clicks": 1200, "percentage": 37.5 },
      { "type": "TABLET", "clicks": 200, "percentage": 6.25 }
    ],
    "operatingSystems": [
      { "os": "iOS", "clicks": 1000, "percentage": 31.25 },
      { "os": "Android", "clicks": 800, "percentage": 25.0 },
      { "os": "Windows", "clicks": 700, "percentage": 21.88 }
    ]
  }
}
```

### 瀏覽器

```json
{
  "browsers": [
    { "browser": "Chrome", "clicks": 1400, "percentage": 43.75 },
    { "browser": "Safari", "clicks": 900, "percentage": 28.13 },
    { "browser": "Firefox", "clicks": 500, "percentage": 15.63 }
  ]
}
```

### 來源追蹤

```json
{
  "referrers": [
    { "source": "google.com", "clicks": 800 },
    { "source": "facebook.com", "clicks": 500 },
    { "source": "direct", "clicks": 1200 }
  ]
}
```

### UTM 參數

追蹤行銷活動效果：

```json
{
  "utm": {
    "sources": [
      { "source": "newsletter", "clicks": 600 },
      { "source": "google", "clicks": 400 }
    ],
    "mediums": [
      { "medium": "email", "clicks": 600 },
      { "medium": "cpc", "clicks": 350 }
    ],
    "campaigns": [
      { "campaign": "summer_sale", "clicks": 450 }
    ]
  }
}
```

## 日期範圍

### 支援的範圍

| 參數 | 說明 |
|-----|------|
| `startDate` | 開始日期（ISO 8601） |
| `endDate` | 結束日期（ISO 8601） |
| `timezone` | 時區（例如：Asia/Taipei） |

**範例：**

```
GET /api/analytics/urls/{id}?startDate=2025-01-01&endDate=2025-01-31&timezone=Asia/Taipei
```

### 預設值

| 設定 | 預設值 |
|-----|--------|
| 最大範圍 | 365 天 |
| 預設範圍 | 過去 30 天 |

## 機器人偵測

自動偵測並分類機器人流量：

### 取得機器人分析

```
GET /api/analytics/urls/{id}/bots?startDate=2025-01-01&endDate=2025-01-31
```

**回應：**

```json
{
  "totalBotClicks": 450,
  "botPercentage": 14.06,
  "botTypes": [
    { "type": "Googlebot", "clicks": 200 },
    { "type": "Bingbot", "clicks": 120 },
    { "type": "Others", "clicks": 130 }
  ]
}
```

### 整體機器人分析

```
GET /api/analytics/bots/overview
```

## 資料匯出

### 匯出分析資料

```
GET /api/analytics/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
```

**參數：**

| 參數 | 說明 | 選項 |
|-----|------|------|
| `format` | 匯出格式 | csv、json |
| `startDate` | 開始日期 | ISO 8601 |
| `endDate` | 結束日期 | ISO 8601 |
| `urlId` | 特定網址（選填） | URL ID |

### CSV 格式

```csv
date,url_id,slug,clicks,unique_visitors,country,device
2025-01-01,url_123,summer-sale,520,480,TW,MOBILE
2025-01-01,url_123,summer-sale,120,100,US,DESKTOP
```

### JSON 格式

```json
{
  "exportDate": "2025-01-15T10:00:00Z",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "data": [
    {
      "date": "2025-01-01",
      "urlId": "url_123",
      "slug": "summer-sale",
      "clicks": 520,
      "uniqueVisitors": 480,
      "geographic": {...}
    }
  ]
}
```

## 即時點擊

### 最近點擊記錄

```
GET /api/analytics/urls/{id}/clicks/recent?limit=20
```

**回應：**

```json
{
  "clicks": [
    {
      "id": "click_123",
      "timestamp": "2025-01-15T10:30:00Z",
      "ip": "192.168.x.x",
      "country": "TW",
      "city": "Taipei",
      "device": "MOBILE",
      "os": "iOS",
      "browser": "Safari",
      "referer": "https://facebook.com",
      "isBot": false
    }
  ]
}
```

## 快取

分析資料會被快取以提升效能：

| 端點 | 快取時間 |
|-----|---------|
| 整體概覽 | 5 分鐘 |
| 網址分析 | 5 分鐘 |
| 即時點擊 | 不快取 |

## 隱私考量

### 資料收集

| 收集項目 | 說明 |
|---------|------|
| IP 位址 | 用於地理位置（可匿名化） |
| User Agent | 用於裝置/瀏覽器偵測 |
| Referer | 用於來源追蹤 |
| 時間戳記 | 用於趨勢分析 |

### 不收集的資料

- 個人識別資訊（PII）
- Cookie 追蹤
- 跨網站追蹤

### GDPR 合規

- 可設定 IP 匿名化
- 支援資料保留政策
- 提供資料匯出功能

## A/B 測試分析

### 取得變體分析

```
GET /api/analytics/urls/{id}/ab-test?startDate=2025-01-01&endDate=2025-01-31
```

**回應：**

```json
{
  "urlId": "url_123",
  "variants": [
    {
      "variantId": "var_a",
      "name": "變體 A",
      "clicks": 1600,
      "percentage": 50.0,
      "conversionRate": 3.2
    },
    {
      "variantId": "var_b",
      "name": "變體 B",
      "clicks": 1600,
      "percentage": 50.0,
      "conversionRate": 4.1
    }
  ]
}
```

## 速率限制

| 端點 | 限制 |
|-----|------|
| 分析查詢 | 60 次/分鐘 |
| 資料匯出 | 10 次/分鐘 |

## 最佳實踐

### 1. 設定合理的日期範圍

- 報表查詢使用較短範圍
- 避免一次查詢超過 90 天
- 使用分頁處理大量資料

### 2. 利用快取

- 相同查詢會返回快取結果
- 在快取期間內重複查詢更有效率

### 3. 定期匯出

- 設定定期匯出排程
- 備份重要的分析資料
- 整合到您的資料倉儲

### 4. 監控機器人流量

- 定期檢查機器人比例
- 異常高的機器人流量可能表示問題
- 將機器人資料與人類流量分開分析

## 下一步

- [A/B 測試](/zh-TW/features/ab-testing) - 分流測試您的網址
- [智慧路由](/zh-TW/features/smart-routing) - 依條件路由分析
- [Webhooks](/zh-TW/features/webhooks) - 即時點擊通知
