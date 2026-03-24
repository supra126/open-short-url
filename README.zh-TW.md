# Open Short URL

> **強大的自架短網址服務，提供進階分析與隱私優先設計**

將冗長的網址轉換為簡短易記的連結，同時完全掌控您的資料。適合需要進階短網址功能的企業、行銷人員與注重隱私的使用者。

[English](./README.md) | [繁體中文](./README.zh-TW.md)

---

## 為什麼選擇 Open Short URL？

### 🔐 您的資料，您做主

不同於商業短網址服務，您的資料保存在自己的伺服器上。沒有第三方追蹤、沒有資料販售，完全隱私。適合注重隱私的團隊與需要 GDPR 合規的組織。

### 💰 成本效益高

擺脫昂貴的 SaaS 訂閱費用：

- 無月費或年費
- 無連結數或點擊數限制
- 一次性基礎設施投資
- 擴展規模無需增加成本
- 可預測的營運開支

適合企業與行銷人員取代昂貴的 SaaS 訂閱方案。

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

專為需要完整 API 存取與零供應商鎖定的開發者打造。

---

## 部署

### 零配置體驗

```bash
curl -O https://raw.githubusercontent.com/supra126/open-short-url/main/docker-compose.quickstart.yml
docker compose -f docker-compose.quickstart.yml up -d
```

開啟 `http://localhost:4100`，使用 `admin@example.com` / `admin123` 登入。僅供測試，請勿用於正式環境。

### 快速安裝（VPS / Docker）

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/setup.sh)
```

互動式腳本會詢問網域和管理員密碼，自動產生密鑰並啟動所有服務。

### 部署到 Fly

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/fly-setup.sh)
```

將前後端與 Postgres 一起部署到 Fly。也支援只部署後端（前端使用 Vercel）。

### 一鍵部署到 PaaS 平台

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/openshorturl-1?referralCode=EnYHPz&utm_medium=integration&utm_source=template&utm_campaign=generic)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/supra126/open-short-url)

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/supra126/open-short-url/tree/main)

各平台會自動配置 PostgreSQL、部署前後端服務，並設定環境變數。

### Vercel（僅前端）

如果前端想用 Vercel，先用上述任一方式部署後端，然後：

1. 在 Vercel 匯入此 repo
2. **Root Directory** 設為 `apps/frontend`
3. 新增環境變數：
   - `NEXT_PUBLIC_API_URL` = 後端 URL
   - `NEXT_PUBLIC_SHORT_URL_DOMAIN` = 後端 URL
4. 部署

**部署完成後：**

- 🔐 請立即變更預設管理員密碼
- ⚠️ 在平台設定中配置自訂網域

---

## Redis

Redis 為**完全選用**。未設定 `REDIS_HOST` 時，快取、Token 黑名單與速率限制會自動降級為 in-memory 替代方案。建議在日流量超過 5 萬次點擊或多實例部署時啟用 Redis。

---

## AI 整合

**內建 AI 聊天** — 直接在網頁介面透過自然語言管理短網址。支援 Anthropic Claude、OpenAI GPT、Google Gemini、Mistral 和 Cohere。在前端 `.env.local` 設定環境變數即可啟用。

**MCP Server** — 透過 [Model Context Protocol](https://modelcontextprotocol.io) 連接外部 AI 助手（Claude Desktop、Cursor、Windsurf）到您的實例。使用 `npm install -g @open-short-url/mcp` 安裝。詳見 [MCP 文件](./packages/mcp/README.zh-TW.md)。

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

- [x] 智慧條件式路由（依裝置、地區、時間條件重導向）
- [x] Docker 容器化與多平台映像檔
- [x] 快速部署（Vercel、Render、Railway、DigitalOcean、Fly...）
- [x] Open Graph / 社群預覽自訂
- [ ] 深度連結（App Links / Universal Links）
- [ ] Retargeting Pixel 整合

---

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案。

---

## 支援

- 📖 [文件](https://supra126.github.io/open-short-url)
- 🐛 [問題追蹤](https://github.com/supra126/open-short-url/issues)
