# Open Short URL

> **強大的自架短網址服務，提供進階分析與隱私優先設計**

將冗長的網址轉換為簡短易記的連結，同時完全掌控您的資料。適合需要進階短網址功能的企業、行銷人員與注重隱私的使用者。

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/EATit9?referralCode=EnYHPz&utm_medium=integration&utm_source=template&utm_campaign=generic)
[![npm version](https://img.shields.io/npm/v/@open-short-url/mcp.svg)](https://www.npmjs.com/package/@open-short-url/mcp)

[English](./README.md) | [繁體中文](#繁體中文)

---

## 為什麼選擇 Open Short URL？

### 🔐 您的資料，您做主

不同於商業短網址服務，您的資料保存在自己的伺服器上。沒有第三方追蹤、沒有資料販售，完全隱私。

### 💰 成本效益高

擺脫昂貴的 SaaS 訂閱費用：

- 無月費或年費
- 無連結數或點擊數限制
- 一次性基礎設施投資
- 擴展規模無需增加成本
- 可預測的營運開支

### 📊 全面的分析功能

追蹤每一次點擊，獲得詳細洞察：

- 即時點擊追蹤
- 地理位置資料
- 裝置與瀏覽器分析
- 來源追蹤
- UTM 行銷活動監控

### 🎨 白標客製化

完全可自訂品牌形象：

- 自訂網域支援
- 品牌化密碼頁面
- 個人化 Logo 與顏色
- 您的品牌，您的風格

### 🔒 進階安全性

- 密碼保護網址
- 連結到期日設定
- 速率限制防濫用
- Cloudflare Turnstile 整合
- 角色權限控制（管理員/使用者）

### 🚀 企業級功能

- RESTful API 與完整文件
- API 金鑰管理便於整合
- Webhook 事件通知（HMAC-SHA256 簽名）
- A/B 測試（網址變體與流量分配）
- 連結組合功能整理網址
- 機器人偵測與過濾
- 雙因素驗證（2FA）
- 批次網址管理
- QR Code 產生器
- 多語言支援（英文、繁體中文、葡萄牙語）
- **AI 智能功能**：
  - 內建 AI 聊天助手（Anthropic Claude、OpenAI GPT、Google Gemini）
  - Model Context Protocol (MCP) server 支援外部 AI 助手

---

## 主要功能

✨ **智慧連結管理**

- 自訂短碼或自動產生
- 根據使用量動態調整短碼長度
- 連結到期與排程
- 狀態控制（啟用/停用）

📈 **強大的分析工具**

- 點擊統計儀表板
- 時間序列分析
- 地理分布
- 裝置與平台分析
- UTM 參數追蹤

🔑 **彈性驗證機制**

- JWT 使用者驗證
- API 金鑰支援伺服器整合
- 雙因素驗證
- 工作階段管理

🎯 **行銷工具**

- 敏感連結密碼保護
- UTM 參數建構器
- QR Code 產生
- 品牌客製化

⚡ **高效能**

- 選用 Redis 快取加速轉址
- PostgreSQL 可靠的資料儲存
- 為規模化優化

📦 **連結組織管理**

- 將網址分組為主題式組合/集合
- 自訂組合顏色與圖示
- 組合的累計點擊統計
- 組合的 7 天點擊趨勢視覺化
- 單一視圖管理多個網址
- 封存與還原組合

🤖 **機器人偵測**

- 自動識別機器人流量
- 分析中過濾機器人點擊
- 機器人類型分類（Googlebot、Bingbot 等）
- 獨立的機器人分析儀表板
- 切換點擊記錄中的機器人顯示

---

## 部署

### 一鍵部署到 Railway

最快的開始方式是透過一鍵部署到 Railway：

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/EATit9?referralCode=EnYHPz&utm_medium=integration&utm_source=template&utm_campaign=generic)

將自動完成：

- ✅ 部署前端與後端服務
- ✅ 配置 PostgreSQL 與 Redis 資料庫
- ✅ 設定環境變數

**重要提醒：**

- ⚠️ 自訂網域需要在 Railway 設定中手動配置
- 🔐 部署完成後，請立即變更預設管理員密碼

---

## Redis 使用指南

Redis 為**完全選用**，系統會自動優雅降級。系統在沒有 Redis 的情況下也能完美運作。

### 🎯 **哪些功能使用 Redis？**

當 Redis 可用時，以下功能會使用它來提升效能：

1. **URL 查詢快取** - 更快的重定向（300ms → 10-20ms）
2. **Token 黑名單** - 多實例間共享（登出同步）
3. **速率限制** - 跨實例的準確節流

### 🔄 **自動降級（未設定 Redis）**

如果未設定 `REDIS_HOST`，系統會自動使用降級機制：

| 功能             | 沒有 Redis 時          | 影響                       |
| ---------------- | ---------------------- | -------------------------- |
| **URL 快取**     | 停用（直接查詢資料庫） | 重定向較慢，資料庫負載較高 |
| **Token 黑名單** | In-memory Map          | 僅適用於單一實例           |
| **速率限制**     | In-memory Map          | 僅適用於單一實例           |

**系統狀態：** 功能完整，只是高流量時較慢。

### ❌ **略過 Redis（< 每日 1 萬次點擊）**

**適用於：**

- 個人使用或小團隊工具
- 開發/測試環境
- 預算有限的起步階段
- 單一實例部署

**流量指標：**

- 流量：< 每日 10,000 次點擊（~0.12 QPS）
- 峰值並發：< 每秒 10 次請求

**優點：**

- ✅ 降低基礎設施成本（約 $5-10/月）
- ✅ 簡化維護（少一個服務）
- ✅ 無需 Redis 設定

### ✅ **使用 Redis（> 每日 5 萬次點擊）**

**建議使用於：**

- 行銷活動導致流量激增
- 分析頁面被頻繁查看
- 熱門 URL（20% 的 URL 佔 80% 流量）
- 多實例部署

**流量指標：**

- 流量：> 每日 50,000 次點擊（~0.6 QPS）
- 峰值並發：> 每秒 20 次請求

**效能提升：**

- 重定向時間：300ms → 10-20ms
- 資料庫負載：降低 70% 到 90%
- 可支撐 10-100 倍流量
- 登出在所有實例間同步

**成本：** 約 $15-25/月（效能提升 5-10 倍）

### ⚠️ **強烈建議使用 Redis（> 每日 100 萬次點擊）**

**必要使用於：**

- SaaS 產品或高流量服務
- 多實例正式環境部署
- 需要保證速率限制的服務

**流量指標：**

- 流量：> 每日 1,000,000 次點擊（~12 QPS）
- 峰值並發：> 每秒 100 次請求

**不使用 Redis 的風險：**

- 資料庫成為瓶頸
- 用戶體驗下降
- 速率限制僅限單一實例（非全域）

### 📊 **如何判斷**

監控這些指標：

- **資料庫查詢時間** > 200ms → 考慮使用 Redis
- **重定向響應** > 500ms → 需要優化
- **相同 URL** 每小時被查詢 > 10 次 → 快取有幫助
- **多實例部署** → 需要 Redis 同步

### 🚀 **Railway 部署**

**選項 A：不使用 Redis（簡單且便宜）**

1. 不要新增 Redis 服務
2. 不要設定 `REDIS_HOST` 環境變數
3. 系統使用自動降級
4. 成本：約 $5-10/月

**選項 B：使用 Redis（效能）**

1. 在 Railway 新增 Redis 服務
2. 環境變數自動設定：
   ```
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.REDISPORT}}
   REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
   ```
3. 系統自動偵測並使用 Redis
4. 成本：約 $15-25/月

**隨時切換：** 可隨時新增或移除 Redis，無需修改程式碼。系統會自動適應。

---

## 快速開始

### 系統需求

- Node.js 18+
- PostgreSQL 14+
- Redis 6+（選用，用於快取）

### 安裝步驟

1. **複製專案**

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url
```

2. **安裝相依套件**

```bash
pnpm install
```

3. **設定環境變數**

```bash
# 後端
cp apps/backend/.env.example apps/backend/.env.local
# 編輯 apps/backend/.env.local，填入您的資料庫憑證

# 前端
cp apps/frontend/.env.example apps/frontend/.env.local
# 編輯 apps/frontend/.env.local，填入 API URL
# 選用：設定 NEXT_PUBLIC_LOCALE=zh-TW 使用繁體中文（預設為 en）
```

4. **設定資料庫**

```bash
cd apps/backend
pnpm prisma:migrate
pnpm prisma:seed
```

5. **啟動開發伺服器**

```bash
# 從專案根目錄
pnpm dev
```

開啟網址：

- 前端：http://localhost:4100
- 後端 API：http://localhost:4101
- API 文件：http://localhost:4101/api

預設帳號：`admin@example.com` / `admin123`

---

## 🤖 內建 AI 聊天助手

直接在網頁介面透過對話式 AI 管理您的短網址。

### 支援的 AI 供應商

- **Anthropic Claude**（claude-3-5-sonnet、claude-3-5-haiku 等）
- **OpenAI GPT**（gpt-4o、gpt-4o-mini、gpt-4-turbo 等）
- **Google Gemini**（gemini-2.0-flash-exp、gemini-1.5-pro 等）
- **Mistral**（mistral-large-latest、mistral-medium 等）
- **Cohere**（command-r-plus、command-r 等）

### 設定方式

在後端 `.env.local` 設定環境變數來啟用 AI：

```bash
# 選擇您的 AI 供應商
AI_PROVIDER=anthropic  # 選項：anthropic、openai、google、mistral、cohere

# Anthropic Claude
AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# OpenAI GPT
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-your-api-key-here

# Google Gemini
AI_MODEL=gemini-2.0-flash-exp
GOOGLE_API_KEY=your-api-key-here

# Mistral
AI_MODEL=mistral-large-latest
MISTRAL_API_KEY=your-api-key-here

# Cohere
AI_MODEL=command-r-plus
COHERE_API_KEY=your-api-key-here
```

### 功能特色

- 🗣️ **自然語言介面**：透過對話方式管理網址
- 🔧 **自動化操作**：使用簡單指令建立、更新、刪除網址
- 📊 **分析查詢**：詢問點擊統計與效能數據
- 🧪 **A/B 測試管理**：設定與管理網址變體
- 📁 **組合整理**：建立與管理連結集合
- 🌐 **多語言**：完整支援英文與繁體中文

### 存取路徑

設定完成後，可存取 AI 功能：

- **AI 聊天**：`/ai-chat` - 對話式網址管理介面
- **AI 設定**：`/ai-settings` - 設定指南與狀態儀表板

### 範例指令

- 「幫我建立 https://example.com 的短網址，短碼設為 'promo'」
- 「顯示本週建立的所有網址」
- 「點擊量最高的前 5 個網址是哪些？」
- 「幫我建立一個夏季活動的 Bundle」
- 「設定 A/B 測試，流量分配 60/40」

---

## 🤖 AI 助手整合（MCP）

透過 Model Context Protocol (MCP) 整合，使用 AI 助手管理您的短網址。

### 什麼是 MCP？

[Model Context Protocol](https://modelcontextprotocol.io) 是一個開放標準，讓 AI 應用能夠安全地連接到外部工具和資料來源。我們的 MCP server 讓 Claude Desktop、Cursor、Windsurf 等 AI 助手能透過自然對話管理您的短網址。

### 安裝

全域安裝 MCP server：

```bash
npm install -g @open-short-url/mcp
```

### 設定

在您的 MCP 客戶端（例如 Claude Desktop）中設定：

```json
{
  "mcpServers": {
    "open-short-url": {
      "command": "open-short-url-mcp",
      "env": {
        "API_URL": "https://your-backend.com",
        "API_KEY": "ak_your_api_key_here"
      }
    }
  }
}
```

### 您可以做什麼

設定完成後，您可以請 AI 助手：

- 「幫我建立 https://example.com 的短網址，自訂短碼為 'promo'」
- 「顯示本月所有的短網址」
- 「幫我生成短網址 abc123 的 QR Code」
- 「我的活動網址點擊統計如何？」
- 「建立一個叫『夏季活動』的 Bundle，並加入這些網址...」
- 「設定 A/B 測試，流量各分配 50%」

### 可用功能

MCP server 提供 29 個工具，涵蓋：

- URL 管理（建立、列表、更新、刪除、QR Code）
- Bundle 管理（組織網址為集合）
- 分析功能（詳細點擊追蹤與統計）
- A/B 測試（建立與管理網址變體）

### 了解更多

- 📦 [MCP Server 套件](https://www.npmjs.com/package/@open-short-url/mcp)
- 📖 [MCP Server 文件](./packages/mcp/README.zh-TW.md)
- 🌐 [Model Context Protocol](https://modelcontextprotocol.io)

---

## 使用案例

### 企業應用

- 建立品牌化短連結進行行銷活動
- 透過詳細分析追蹤活動成效
- 密碼保護機密連結
- 跨通路維持品牌一致性

### 開發者

- 自架解決方案，完整 API 存取權
- 透過 REST API 與現有系統整合
- 自訂與擴充功能
- 無供應商鎖定

### 隱私倡議者

- 完全的資料所有權
- 無第三方追蹤
- GDPR 合規
- 開源透明

---

## 連結組合

透過連結組合功能高效組織與管理您的網址。

### 功能特色

- **視覺化組織**：色彩編碼的組合與自訂圖示（16 個預設表情符號）
- **累計分析**：
  - 組合內所有網址的總點擊數
  - 網址數量與分布
  - 識別表現最佳的網址
  - 7 天點擊趨勢視覺化
- **彈性管理**：
  - 動態新增/移除網址
  - 自訂組合內網址的排序
  - 封存閒置的組合
  - 搜尋與篩選功能
- **批次操作**：
  - 一次新增多個網址
  - 建立組合時同時加入網址
  - 跨不同組合管理網址

### 使用案例

- **行銷活動**：將所有活動網址分組以統一追蹤
- **產品發布**：依產品或功能組織網址
- **社群媒體**：依平台整理網址
- **客戶專案**：依客戶或專案分類網址
- **季節性內容**：組織有時效性的網址

### 統計追蹤

每個組合提供：

- 總點擊數（所有網址的總和）
- 網址數量
- 表現最佳的網址
- 7 天點擊趨勢圖表
- 各網址的效能指標

---

## Webhook 驗證指南

Open Short URL 使用 **HMAC-SHA256** 簽名機制確保 webhook 傳送的安全性。接收端必須驗證簽名以確保請求來自您的伺服器。

### 📋 驗證步驟

系統會在每個 webhook 請求的 `X-Webhook-Signature` header 中包含 HMAC-SHA256 簽名。以下是驗證範例：

```javascript
const crypto = require('crypto');
const express = require('express');

function verifyWebhookSignature(request, secret) {
  // 1. 從 header 取得簽名
  const receivedSignature = request.headers['x-webhook-signature'];

  // 2. 讀取原始 request body（必須是完整的 JSON 字符串）
  const payload = JSON.stringify(request.body);

  // 3. 使用相同的 secret 和演算法重新計算簽名
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // 4. 使用時間安全的比較方法（防止時序攻擊）
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Express.js 使用範例
const app = express();

app.post('/webhook', express.json(), (req, res) => {
  const secret = process.env.WEBHOOK_SECRET; // 您設定的 webhook secret

  // 驗證簽名
  if (!verifyWebhookSignature(req, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 取得事件資訊
  const event = req.headers['x-webhook-event'];
  const deliveryId = req.headers['x-webhook-delivery-id'];
  const attempt = req.headers['x-webhook-attempt'];

  // 處理 webhook 事件
  console.log('Event:', event);
  console.log('Delivery ID:', deliveryId);
  console.log('Attempt:', attempt);
  console.log('Data:', req.body.data);

  // 回應成功（2xx 狀態碼）
  res.status(200).json({ received: true });
});

app.listen(3000);
```

### ⚠️ 重要注意事項

1. **JSON 序列化方式**
   - 必須使用與發送端相同的 JSON 序列化方式（無空格）
   - 使用 `JSON.stringify()` 時不要添加格式化參數

2. **原始 Request Body**
   - 使用原始 body：驗證前不要修改 request body
   - 確保 body parser 正確處理 JSON

3. **時間安全比較**
   - 使用 `crypto.timingSafeEqual()` 防止時序攻擊
   - 不要使用 `===` 或 `==` 比較簽名

4. **其他 Headers**
   - `X-Webhook-Event`: 事件類型（如 `url.created`、`url.clicked`）
   - `X-Webhook-Delivery-Id`: 傳送 ID（可用於冪等性檢查，避免重複處理）
   - `X-Webhook-Attempt`: 重試次數（1-3，系統會自動重試失敗的傳送）

5. **回應要求**
   - 必須在 10 秒內回應
   - 回應 2xx 狀態碼表示成功
   - 非 2xx 狀態碼會觸發重試機制（最多 3 次）

### 📦 Payload 結構

#### **url.created / url.updated / url.deleted**

```json
{
  "event": "url.created",
  "timestamp": "2025-10-21T02:05:16.123Z",
  "data": {
    "urlId": "clxxx123456789",
    "slug": "abc123",
    "originalUrl": "https://example.com",
    "userId": "user123"
  }
}
```

#### **url.clicked**

```json
{
  "event": "url.clicked",
  "timestamp": "2025-10-21T02:05:16.123Z",
  "data": {
    "urlId": "clxxx123456789",
    "slug": "abc123",
    "targetUrl": "https://example.com/landing-page",
    "variantId": "variant_id",
    "variantName": "Variant A",
    "clickData": {
      "ip": "1.2.3.4",
      "userAgent": "Mozilla/5.0...",
      "referer": "https://google.com",
      "browser": "Chrome",
      "os": "Windows",
      "device": "Desktop",
      "country": "TW",
      "isBot": false,
      "utmSource": "newsletter",
      "utmMedium": "email",
      "utmCampaign": "summer_sale",
      "utmTerm": "keyword",
      "utmContent": "header_link"
    }
  }
}
```

**注意：**

- `timestamp`: 點擊發生的準確時間（ISO 8601 格式）
- `targetUrl`: 實際跳轉的目標 URL（如果是 A/B 測試，會是選中的變體 URL）
- `variantId` 和 `variantName`: 如果是 A/B 測試且選中變體，會包含這些欄位；如果選中控制組（原始 URL），則為 `null`
- `clickData.browser/os/device`: 從 User-Agent 解析而來
- `clickData.country`: 從 IP 地址解析而來（國家代碼）
- `clickData.isBot`: 是否為機器人流量

### 🎯 支援的事件類型

- `url.created` - 新增短網址時觸發
- `url.updated` - 更新短網址時觸發
- `url.deleted` - 刪除短網址時觸發
- `url.clicked` - 短網址被點擊時觸發
- `webhook.test` - 測試 webhook 時觸發

---

## 技術架構

- **後端**：NestJS、Prisma、PostgreSQL、Redis（選用）
- **前端**：Next.js 16、React 19、TypeScript、Tailwind CSS、TanStack Query
- **安全性**：JWT、bcrypt、Cloudflare Turnstile
- **分析**：即時點擊追蹤與地理資料、機器人偵測
- **視覺化**：Recharts 資料視覺化
- **AI 整合**：Model Context Protocol (MCP) server，支援 AI 助手相容性

---

## 開發路線圖

- [x] 審計日誌
- [x] 自訂日期範圍分析
- [x] 資料匯出 (CSV/JSON)
- [ ] 進階連結排程
- [ ] 自訂品牌 QR Code

---

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案。

---

## 支援

- 🐛 [問題追蹤](https://github.com/supra126/open-short-url/issues)
