# Open Short URL - MCP Server

[English](README.md) | [繁體中文](README.zh-TW.md)

> Model Context Protocol (MCP) Server for Open Short URL，讓 AI 助手能夠管理您的短網址系統。

[![npm version](https://img.shields.io/npm/v/@open-short-url/mcp.svg)](https://www.npmjs.com/package/@open-short-url/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **⚠️ 注意**: 此版本為 v0.1.0 早期測試版，API 可能會有變動。歡迎回報問題和建議！

---

## ⚠️ 使用前提

> **🔴 重要**: 此 MCP Server 是 **Open Short URL 的客戶端工具**，需要連接到已部署的 Open Short URL 後端系統才能使用。
>
> 這不是一個獨立的短網址服務，而是透過支援 MCP 協議的 AI 應用來管理您現有的短網址系統。

### 📋 必要條件

在安裝此 MCP Server 之前，請確保您已具備：

#### 1. ✅ Open Short URL 後端系統（必須！）

您需要先部署 Open Short URL 後端：

- 📦 **部署後端**: 從 [Open Short URL 主專案](https://github.com/supra126/open-short-url) 部署
- 🔧 **確保運行**: 後端必須正在運行並可透過網路訪問
- 🗄️ **配置資料庫**: PostgreSQL 已正確設置
- 🌐 **取得 URL**: 記下您的後端網址（例如：`https://your-backend.com`）

> 💡 **沒有後端系統？** 請先前往 [主專案倉庫](https://github.com/supra126/open-short-url) 了解如何部署後端。

#### 2. ✅ API Key

從您的後端系統獲取 API Key：

1. 登入後端管理介面
2. 前往「設定」→「API Keys」
3. 點擊「創建新的 API Key」
4. 複製生成的 API Key（格式：`ak_xxxxxxxxxxxxxx`）

### 🧪 快速測試連接

安裝前，建議先測試後端 API 是否可正常訪問：

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-backend.com/api/urls
```

**預期結果**: 返回 JSON 格式的短網址列表

**如果失敗**: 請檢查：

- ✓ 後端服務是否正在運行
- ✓ API URL 是否正確
- ✓ API Key 是否有效
- ✓ 防火牆是否允許連接

---

## 🌟 功能特色

### URL 管理

- ✅ **創建短網址** - 支援自定義 slug、密碼保護、過期時間、UTM 參數
- 📋 **列出短網址** - 分頁、搜尋、篩選、排序
- 🔍 **查詢詳情** - 獲取單個短網址的完整資訊
- ✏️ **更新設定** - 修改網址、標題、狀態等
- 🗑️ **刪除網址** - 移除短網址及相關數據
- 📱 **生成 QR Code** - 為短網址生成 QR Code

### Bundle 管理

- 📦 **創建 Bundle** - 組織和分組多個短網址
- 📂 **管理 Bundle** - 列出、查詢、更新、刪除 Bundle
- 🔗 **URL 關聯** - 添加/移除 URL 到 Bundle
- 📊 **Bundle 統計** - 查看 Bundle 的點擊統計
- 🗂️ **歸檔管理** - 歸檔/恢復 Bundle

### 分析數據

- 📊 **點擊分析** - 地理位置、設備、瀏覽器分布
- 📈 **趨勢分析** - 按時間的點擊趨勢
- 🤖 **機器人分析** - 識別和分析機器人流量
- 📝 **最近點擊** - 查看最新的訪客記錄

### A/B 測試

- 🧪 **創建變體** - 設置不同的目標網址
- ⚖️ **流量分配** - 自定義各變體的流量權重
- 📊 **效果分析** - 比較各變體的表現

---

## 🚀 快速開始

### 1. 安裝

#### 方式一：全局安裝（推薦）

```bash
npm install -g @open-short-url/mcp
```

> ⭐ **推薦理由**: MCP Server 作為背景服務，全局安裝可提供最佳體驗
>
> - ⚡ 啟動速度快（< 100ms）
> - 🔌 離線也能使用
> - 🎯 穩定可靠

#### 方式二：使用 npx（快速試用）

```bash
npx @open-short-url/mcp
```

> ⚠️ **注意**: 適合快速試用，但首次啟動較慢（1-5 秒），建議正式使用改用全局安裝

#### 方式三：從源碼建置

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url/packages/mcp
pnpm install
pnpm build
```

### 2. 獲取 API Key

1. 登入您的 Open Short URL 後端系統
2. 前往「設定」→「API Keys」
3. 點擊「創建新的 API Key」
4. 複製生成的 API Key（例如: `ak_1234567890abcdef`）

---

## 🔧 使用方式

#### 選項 1: 使用全局安裝（推薦）⭐

> 需先執行：`npm install -g @open-short-url/mcp`

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

**優點**: ⚡ 啟動快速、穩定可靠、離線可用

#### 選項 2: 使用 npx（快速試用）

```json
{
  "mcpServers": {
    "open-short-url": {
      "command": "npx",
      "args": ["-y", "@open-short-url/mcp"],
      "env": {
        "API_URL": "https://your-backend.com",
        "API_KEY": "ak_your_api_key_here"
      }
    }
  }
}
```

**優點**: 無需安裝、永遠最新
**缺點**: ⚠️ 首次啟動較慢（1-5 秒）

#### 選項 3: 使用本地建置（開發者）

```json
{
  "mcpServers": {
    "open-short-url": {
      "command": "node",
      "args": ["/絕對路徑/open-short-url/packages/mcp/dist/index.js"],
      "env": {
        "API_URL": "https://your-backend.com",
        "API_KEY": "ak_your_api_key_here"
      }
    }
  }
}
```

**適用**: 需要修改源碼或調試

### 在 MCP 客戶端中使用

任何支援 Model Context Protocol 的應用都可以使用此 MCP Server。

#### 通用配置格式

根據您使用的 MCP 客戶端，配置格式可能略有不同，但核心要素相同：

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

#### 環境變數說明

| 變數名稱  | 必填 | 說明                         | 範例                       |
| --------- | ---- | ---------------------------- | -------------------------- |
| `API_URL` | ✅   | Open Short URL 後端 API 地址 | `https://your-backend.com` |
| `API_KEY` | ✅   | 後端系統生成的 API Key       | `ak_1234567890abcdef`      |

---

## 💬 使用範例

### 創建短網址

```
用戶：幫我把 https://example.com/very-long-url 縮短

Claude：我來為您創建短網址...
[調用 create_short_url 工具]
已為您創建短網址：
- 短網址: https://your-domain.com/abc123
- 原始網址: https://example.com/very-long-url
- 點擊次數: 0
```

### 創建帶 UTM 參數的短網址

```
用戶：幫我創建短網址，加上 UTM 追蹤：
- 原始網址: https://example.com/product
- UTM Source: facebook
- UTM Campaign: summer-sale

Claude：好的，我來創建...
[調用 create_short_url 工具]
已創建帶 UTM 追蹤的短網址：
- 短網址: https://your-domain.com/xyz789
- 實際導向: https://example.com/product?utm_source=facebook&utm_campaign=summer-sale
```

### 管理 Bundle

```
用戶：幫我創建一個 Bundle 叫「2025 春季活動」，把 abc123 和 xyz789 加進去

Claude：好的，我來創建 Bundle...
[調用 create_bundle 和 add_multiple_urls_to_bundle 工具]
已創建 Bundle「2025 春季活動」：
- Bundle ID: bundle_abc
- 包含 2 個短網址
- 可用於統一管理和追蹤這批連結
```

### 查看分析數據

```
用戶：我的短網址 abc123 本週有多少點擊？來自哪些國家？

Claude：讓我查詢一下...
[調用 get_url_analytics 工具]
您的短網址本週統計：
- 總點擊數: 1,234 次
- 主要來源國家:
  1. 台灣 (TW): 45%
  2. 美國 (US): 30%
  3. 日本 (JP): 15%
- 主要設備:
  - 手機: 60%
  - 桌面: 35%
  - 平板: 5%
```

### 設置 A/B 測試

```
用戶：幫我對短網址 xyz789 設置 A/B 測試：
- 50% 流量導向 https://landing-a.com
- 50% 流量導向 https://landing-b.com

Claude：好的，我來設置 A/B 測試...
[調用 create_variant 工具兩次]
A/B 測試已設置完成：
- 變體 A: https://landing-a.com (權重: 50%)
- 變體 B: https://landing-b.com (權重: 50%)
系統將自動分配訪客到不同的頁面。
```

### 生成 QR Code

```
用戶：幫我生成 abc123 的 QR Code，大小 500px

Claude：正在生成...
[調用 generate_qrcode 工具]
已生成 QR Code：
- 尺寸: 500x500 px
- 格式: Base64 Data URL
- 可直接嵌入網頁或下載使用
```

---

## 🛠️ 可用工具列表

### URL 管理 (10 個工具)

1. `create_short_url` - 創建短網址
2. `list_short_urls` - 列出所有短網址
3. `get_short_url` - 查詢短網址詳情
4. `update_short_url` - 更新短網址設定
5. `delete_short_url` - 刪除短網址
6. `get_url_stats` - 取得 URL 儀表板統計
7. `generate_qrcode` - 生成 QR Code
8. `bulk_create_urls` - 批量創建短網址（最多 100 個）
9. `bulk_update_urls` - 批量更新短網址（狀態、Bundle、過期時間、UTM）
10. `bulk_delete_urls` - 批量刪除短網址

### Bundle 管理 (12 個工具)

11. `create_bundle` - 創建新的 Bundle
12. `list_bundles` - 列出所有 Bundle
13. `get_bundle` - 查詢 Bundle 詳情
14. `update_bundle` - 更新 Bundle 資訊
15. `delete_bundle` - 刪除 Bundle
16. `add_url_to_bundle` - 添加單個 URL 到 Bundle
17. `add_multiple_urls_to_bundle` - 批量添加 URL 到 Bundle
18. `remove_url_from_bundle` - 從 Bundle 移除 URL
19. `update_url_order_in_bundle` - 更新 URL 在 Bundle 中的順序
20. `get_bundle_stats` - 獲取 Bundle 統計數據
21. `archive_bundle` - 歸檔 Bundle
22. `restore_bundle` - 恢復已歸檔的 Bundle

### 分析數據 (8 個工具)

23. `get_url_analytics` - 獲取 URL 分析數據
24. `get_overview_analytics` - 獲取總覽分析
25. `get_top_performing_urls` - 獲取點擊量最高的 URL
26. `get_recent_clicks` - 查看最近點擊
27. `get_bot_analytics` - 單個 URL 的機器人分析
28. `get_user_bot_analytics` - 全局機器人分析
29. `get_ab_test_analytics` - A/B 測試分析
30. `get_routing_analytics` - 智慧路由統計

### A/B 測試 (5 個工具)

31. `create_variant` - 創建測試變體
32. `list_variants` - 列出所有變體
33. `get_variant` - 查詢變體詳情
34. `update_variant` - 更新變體設定
35. `delete_variant` - 刪除變體

**總計: 35 個 MCP 工具**

---

## 🔍 疑難排解

### MCP Server 無法啟動

**檢查環境變數**：

確認 `API_URL` 和 `API_KEY` 是否正確設定。

**測試 API 連線**：

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-backend.com/api/urls
```

### 工具調用失敗

1. **檢查 API Key** 是否有效且未過期
2. **檢查後端服務** 是否正常運行
3. **檢查網路連線** 是否可達後端
4. **檢查 API 權限** - 確認 API Key 有足夠權限

### 安裝問題

**npm 安裝失敗**：

```bash
# 清除 npm 快取
npm cache clean --force

# 重新安裝
npm install -g @open-short-url/mcp
```

**npx 執行緩慢**：

首次使用 npx 會下載套件，建議改用全局安裝以提升速度。

---

## 🔐 安全建議

### 保護 API Key

- ❌ **不要**將 API Key 分享給他人
- ❌ **不要**將含有 API Key 的配置檔提交到 Git
- ✅ 定期輪換 API Key
- ✅ 為不同環境使用不同的 API Key
- ✅ 為 MCP Server 創建權限最小化的專用 API Key

### API Key 權限建議

建議為 MCP Server 創建專用的 API Key，並設定適當的權限：

- ✅ URL 管理權限
- ✅ Bundle 管理權限
- ✅ 分析數據讀取權限
- ❌ 不需要系統管理員權限
- ❌ 不需要用戶管理權限

---

## 📚 相關資源

- [Open Short URL 主專案](https://github.com/supra126/open-short-url)
- [Model Context Protocol 官方文檔](https://modelcontextprotocol.io)

---

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。
