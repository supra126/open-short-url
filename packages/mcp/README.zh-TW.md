# Open Short URL - MCP Server

[English](README.md) | [繁體中文](README.zh-TW.md)

> Model Context Protocol (MCP) Server for Open Short URL，讓 AI 助手能夠管理您的短網址系統。

[![npm version](https://img.shields.io/npm/v/@open-short-url/mcp.svg)](https://www.npmjs.com/package/@open-short-url/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 使用前提

> **重要**：此 MCP Server 是 **Open Short URL 的客戶端工具**，需要連接到已部署的 Open Short URL 後端系統才能使用。
>
> 這不是一個獨立的短網址服務，而是透過支援 MCP 協議的 AI 應用來管理您現有的短網址系統。

### 必要條件

#### 1. Open Short URL 後端系統（必須）

您需要先部署 Open Short URL 後端：

- 從 [Open Short URL 主專案](https://github.com/supra126/open-short-url) 部署
- 後端必須正在運行並可透過網路訪問
- 記下您的後端網址（例如：`https://your-backend.com`）

> 沒有後端系統？請先前往[主專案倉庫](https://github.com/supra126/open-short-url)了解如何部署。

#### 2. API Key

從您的後端系統獲取 API Key：

1. 登入後端管理介面
2. 前往「設定」→「API Keys」
3. 點擊「創建新的 API Key」
4. 複製生成的 API Key（格式：`ak_xxxxxxxxxxxxxx`）

### 快速測試連接

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-backend.com/api/urls
```

---

## 功能特色

**78 個 MCP 工具**，涵蓋 11 個模組：

| 模組        | 工具數 | 說明                                      |
| ----------- | ------ | ----------------------------------------- |
| URL 管理    | 10     | 建立、列表、更新、刪除、QR Code、批量操作 |
| Bundle 管理 | 12     | 分組管理 URL、排序、歸檔/恢復、統計       |
| 分析數據    | 10     | 點擊分析、趨勢、機器人偵測、數據匯出      |
| A/B 測試    | 5      | 建立變體、流量分配、效果比較              |
| 智慧路由    | 8      | 條件式路由規則、範本、地理/裝置定向       |
| Webhooks    | 8      | 事件通知、傳送日誌、Webhook 測試          |
| 使用者管理  | 11     | 建立/管理使用者、角色、2FA、OIDC 帳號     |
| API Keys    | 4      | 建立、列表、檢視、撤銷 API 金鑰           |
| OIDC/SSO    | 5      | 管理 OIDC/SSO 身份驗證提供者              |
| 系統設定    | 4      | 檢視及管理系統配置                        |
| 稽核日誌    | 1      | 查詢系統稽核紀錄                          |

### 安全機制

- **敏感資料脫敏** — API Key、Token、密碼在所有回應中自動遮蔽
- **破壞性操作標記** — 刪除/重設操作會標示 `[DESTRUCTIVE]`，並提示 AI 助手確認
- **錯誤訊息清理** — 錯誤輸出中的憑證會被自動移除

---

## 快速開始

### 傳輸模式

MCP Server 支援兩種傳輸模式：

| 模式              | 使用場景                                      | 協議            |
| ----------------- | --------------------------------------------- | --------------- |
| **stdio**（預設） | CLI 及 IDE 整合（Claude Desktop、VS Code 等） | 標準 I/O        |
| **http**          | 遠端存取、容器化部署、多客戶端                | Streamable HTTP |

### 方式一：npm（stdio）

#### 全局安裝（推薦）

```bash
npm install -g @open-short-url/mcp
```

#### 使用 npx

```bash
npx @open-short-url/mcp
```

#### MCP 客戶端配置

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

### 方式二：Docker（HTTP）

```bash
docker run -p 3200:3200 \
  -e API_URL=http://your-backend:4101 \
  -e API_KEY=ak_your_api_key_here \
  ghcr.io/supra126/open-short-url-mcp:latest
```

服務將在 `http://localhost:3200/mcp` 啟動。

#### 健康檢查

```bash
curl http://localhost:3200/health
```

### 方式三：Docker Compose

在現有的 Open Short URL 部署中啟用 `mcp` profile：

```bash
docker compose --profile mcp up -d
```

在 `.env.docker` 中設定 `MCP_API_KEY`。完整配置請參考主專案的 `docker-compose.yml`。

### 方式四：從源碼建置

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url/packages/mcp
pnpm install && pnpm build

# stdio 模式
API_URL=https://your-backend.com API_KEY=ak_xxx node dist/index.js

# HTTP 模式
MCP_TRANSPORT=http API_URL=https://your-backend.com API_KEY=ak_xxx node dist/index.js
```

---

## 環境變數

| 變數名稱        | 必填 | 預設值    | 說明                            |
| --------------- | ---- | --------- | ------------------------------- |
| `API_URL`       | 是   | —         | Open Short URL 後端 API 位址    |
| `API_KEY`       | 是   | —         | 後端系統生成的 API Key          |
| `MCP_TRANSPORT` | 否   | `stdio`   | 傳輸模式：`stdio` 或 `http`     |
| `MCP_PORT`      | 否   | `3200`    | HTTP 伺服器埠號（僅 http 模式） |
| `MCP_HOST`      | 否   | `0.0.0.0` | HTTP 綁定位址（僅 http 模式）   |

---

## 可用工具列表（78 個）

### URL 管理（10 個）

| 工具               | 說明                                               |
| ------------------ | -------------------------------------------------- |
| `create_short_url` | 建立短網址（自定義 slug、密碼保護、過期時間、UTM） |
| `list_short_urls`  | 列出所有短網址（分頁、搜尋、篩選）                 |
| `get_short_url`    | 查詢短網址詳情                                     |
| `update_short_url` | 更新短網址設定                                     |
| `delete_short_url` | 刪除短網址 [DESTRUCTIVE]                           |
| `get_url_stats`    | 取得 URL 儀表板統計                                |
| `generate_qrcode`  | 生成短網址 QR Code                                 |
| `bulk_create_urls` | 批量建立短網址（最多 100 個）                      |
| `bulk_update_urls` | 批量更新短網址                                     |
| `bulk_delete_urls` | 批量刪除短網址 [DESTRUCTIVE]                       |

### Bundle 管理（12 個）

| 工具                          | 說明                        |
| ----------------------------- | --------------------------- |
| `create_bundle`               | 建立新的 Bundle             |
| `list_bundles`                | 列出所有 Bundle             |
| `get_bundle`                  | 查詢 Bundle 詳情            |
| `update_bundle`               | 更新 Bundle 資訊            |
| `delete_bundle`               | 刪除 Bundle [DESTRUCTIVE]   |
| `add_url_to_bundle`           | 添加單個 URL 到 Bundle      |
| `add_multiple_urls_to_bundle` | 批量添加 URL 到 Bundle      |
| `remove_url_from_bundle`      | 從 Bundle 移除 URL          |
| `update_url_order_in_bundle`  | 更新 URL 在 Bundle 中的順序 |
| `get_bundle_stats`            | 獲取 Bundle 統計數據        |
| `archive_bundle`              | 歸檔 Bundle                 |
| `restore_bundle`              | 恢復已歸檔的 Bundle         |

### 分析數據（10 個）

| 工具                      | 說明                               |
| ------------------------- | ---------------------------------- |
| `get_url_analytics`       | URL 點擊分析（地理、裝置、瀏覽器） |
| `get_overview_analytics`  | 總覽分析儀表板                     |
| `get_top_performing_urls` | 點擊量最高的 URL                   |
| `get_recent_clicks`       | 最近點擊紀錄                       |
| `get_bot_analytics`       | 單個 URL 的機器人分析              |
| `get_user_bot_analytics`  | 全局機器人分析                     |
| `get_ab_test_analytics`   | A/B 測試分析                       |
| `get_routing_analytics`   | 智慧路由統計                       |
| `export_url_analytics`    | 匯出單個 URL 分析數據（CSV/JSON）  |
| `export_all_analytics`    | 匯出所有分析數據（CSV/JSON）       |

### A/B 測試（5 個）

| 工具             | 說明                   |
| ---------------- | ---------------------- |
| `create_variant` | 建立測試變體           |
| `list_variants`  | 列出所有變體           |
| `get_variant`    | 查詢變體詳情           |
| `update_variant` | 更新變體設定           |
| `delete_variant` | 刪除變體 [DESTRUCTIVE] |

### 智慧路由（8 個）

| 工具                                | 說明                           |
| ----------------------------------- | ------------------------------ |
| `create_routing_rule`               | 建立條件式路由規則             |
| `create_routing_rule_from_template` | 從範本建立規則（地理、裝置等） |
| `list_routing_rules`                | 列出 URL 的路由規則            |
| `get_routing_rule`                  | 查詢路由規則詳情               |
| `update_routing_rule`               | 更新路由規則                   |
| `delete_routing_rule`               | 刪除路由規則 [DESTRUCTIVE]     |
| `update_smart_routing_settings`     | 更新 URL 的路由設定            |
| `list_routing_templates`            | 列出可用的路由範本             |

### Webhooks（8 個）

| 工具                     | 說明                       |
| ------------------------ | -------------------------- |
| `create_webhook`         | 建立 Webhook 端點          |
| `list_webhooks`          | 列出所有 Webhooks          |
| `get_webhook`            | 查詢 Webhook 詳情          |
| `update_webhook`         | 更新 Webhook 設定          |
| `delete_webhook`         | 刪除 Webhook [DESTRUCTIVE] |
| `get_webhook_logs`       | 查看 Webhook 傳送日誌      |
| `test_webhook`           | 發送測試 Webhook 事件      |
| `retry_webhook_delivery` | 重試失敗的 Webhook 傳送    |

### 使用者管理（11 個）

| 工具                       | 說明                             |
| -------------------------- | -------------------------------- |
| `create_user`              | 建立新使用者                     |
| `list_users`               | 列出所有使用者                   |
| `get_user`                 | 查詢使用者詳情                   |
| `update_user_role`         | 更新使用者角色                   |
| `update_user_status`       | 啟用/停用使用者                  |
| `update_user_name`         | 更新使用者顯示名稱               |
| `delete_user`              | 刪除使用者 [DESTRUCTIVE]         |
| `reset_user_password`      | 重設使用者密碼 [DESTRUCTIVE]     |
| `disable_user_2fa`         | 停用使用者 2FA [DESTRUCTIVE]     |
| `get_user_oidc_accounts`   | 列出使用者已連結的 OIDC 帳號     |
| `unlink_user_oidc_account` | 解除連結 OIDC 帳號 [DESTRUCTIVE] |

### API Keys（4 個）

| 工具             | 說明                                   |
| ---------------- | -------------------------------------- |
| `create_api_key` | 建立新 API Key（僅顯示一次，之後遮蔽） |
| `list_api_keys`  | 列出所有 API Keys                      |
| `get_api_key`    | 查詢 API Key 詳情                      |
| `delete_api_key` | 撤銷 API Key [DESTRUCTIVE]             |

### OIDC/SSO 提供者（5 個）

| 工具                   | 說明                           |
| ---------------------- | ------------------------------ |
| `list_oidc_providers`  | 列出 OIDC 提供者               |
| `create_oidc_provider` | 建立 OIDC 提供者               |
| `get_oidc_provider`    | 查詢 OIDC 提供者詳情           |
| `update_oidc_provider` | 更新 OIDC 提供者               |
| `delete_oidc_provider` | 刪除 OIDC 提供者 [DESTRUCTIVE] |

### 系統設定（4 個）

| 工具                    | 說明                       |
| ----------------------- | -------------------------- |
| `get_system_settings`   | 取得所有系統設定           |
| `get_system_setting`    | 取得單一設定值             |
| `update_system_setting` | 更新系統設定               |
| `delete_system_setting` | 刪除系統設定 [DESTRUCTIVE] |

### 稽核日誌（1 個）

| 工具             | 說明                     |
| ---------------- | ------------------------ |
| `get_audit_logs` | 查詢稽核日誌（支援篩選） |

---

## 疑難排解

### MCP Server 無法啟動

1. 確認 `API_URL` 和 `API_KEY` 已正確設定
2. 測試 API 連線：
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://your-backend.com/api/urls
   ```

### 工具調用失敗

1. 檢查 API Key 是否有效且未過期
2. 檢查後端服務是否正常運行
3. 檢查網路連線是否可達後端
4. 檢查 API Key 是否有足夠權限

### Docker 容器問題

1. 確保 `API_URL` 使用 Docker 網路主機名（例如 `http://backend:4101`），而非 `localhost`
2. 查看容器日誌：`docker logs <container-id>`
3. 驗證健康檢查端點：`curl http://localhost:3200/health`

---

## 安全建議

- 不要分享或將 API Key 提交到 Git
- 定期輪換 API Key
- 為不同環境使用不同的 API Key
- 為 MCP Server 建立權限最小化的專用 API Key
- MCP Server 會自動脫敏所有回應中的敏感資料（金鑰、Token、密碼）

---

## 相關資源

- [Open Short URL 主專案](https://github.com/supra126/open-short-url)
- [Model Context Protocol 官方文檔](https://modelcontextprotocol.io)

---

## 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案。
