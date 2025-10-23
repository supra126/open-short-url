/**
 * AI Assistant Capabilities Configuration
 * Single source of truth for all assistant capabilities
 * Used by both prompts and UI components
 */

export interface Capability {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  examples: string[];
}

/**
 * Complete list of AI assistant capabilities
 * Organized by functional area
 */
export const capabilities: Capability[] = [
  {
    id: 'url-management',
    icon: '🔗',
    title: '短網址管理',
    description: '完整的短網址生命週期管理',
    features: [
      '建立短網址（支援自訂 Slug、密碼保護、過期時間）',
      '設定 UTM 追蹤參數（來源、媒介、活動、關鍵字、內容）',
      '查詢和搜尋現有網址',
      '更新網址設定（目標、標題、狀態等）',
      '刪除網址（含所有關聯數據）',
      '生成二維碼',
    ],
    examples: [
      '創建一個行銷活動的短網址，設定 30 天過期並追蹤 UTM 參數',
      '批量建立短網址並整理到 Bundle 中',
      '為現有短網址更新密碼或過期時間',
    ],
  },
  {
    id: 'analytics',
    icon: '📊',
    title: '數據分析',
    description: '詳細的流量和效果分析',
    features: [
      '單個 URL 詳細分析（點擊趨勢、地理位置、設備分佈）',
      '查看整體數據統計',
      '檢查最近點擊記錄（支援機器人過濾）',
      '機器人流量分析',
      'A/B 測試效果對比',
      '自訂時間段和時區分析',
    ],
    examples: [
      '查看過去 30 天的點擊數據分佈',
      '比較 A/B 測試版本的效果',
      '分析機器人流量影響',
    ],
  },
  {
    id: 'ab-testing',
    icon: '🧪',
    title: 'A/B 測試',
    description: '對比不同版本，優化轉換率',
    features: [
      '為短網址建立多個測試版本',
      '自訂各版本的流量分配比例',
      '即時追蹤版本性能',
      '自動禁用已測試的版本',
      '全面的測試分析',
    ],
    examples: [
      '建立 2 個版本，50/50 流量分配，對比著陸頁效果',
      '為營銷活動測試 3 個不同的目標頁面',
    ],
  },
  {
    id: 'bundle-organization',
    icon: '📁',
    title: 'Bundle 組織',
    description: '分組管理相關 URL，提升組織效率',
    features: [
      '建立 Bundle 分組',
      '自訂顏色和圖標',
      '批量管理 URL（新增、移除、排序）',
      '查看 Bundle 統計（點擊數、URL 數量、熱門頁面）',
      '歸檔不用的 Bundle',
      '恢復已歸檔的 Bundle',
    ],
    examples: [
      '為不同的行銷活動建立 Bundle',
      '組織合作夥伴的推薦鏈接',
      '建立產品版本的追蹤組',
    ],
  },
];

/**
 * Get all capabilities as plain-text list
 * Useful for UI display and prompts
 */
export function getCapabilitiesList(): string {
  return capabilities
    .map(
      (cap) =>
        `${cap.icon} **${cap.title}**\n${cap.features.map((f) => `- ${f}`).join('\n')}`
    )
    .join('\n\n');
}

/**
 * Get capability descriptions with examples
 * For the system prompt
 */
export function getDetailedCapabilities(): string {
  return capabilities
    .map(
      (cap) =>
        `### ${cap.icon} ${cap.title}\n${cap.description}\n\n**主要功能：**\n${cap.features.map((f) => `- ${f}`).join('\n')}\n\n**使用案例：**\n${cap.examples.map((e) => `- ${e}`).join('\n')}`
    )
    .join('\n\n');
}

/**
 * Get capabilities for UI hint display
 */
export function getUICapabilities() {
  return capabilities.map((cap) => ({
    icon: cap.icon,
    title: cap.title,
    description: cap.description,
  }));
}
