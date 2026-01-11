import { defineConfig, HeadConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// Google Analytics 4 configuration
const GA4_ID = process.env.VITE_GA4_ID || ''

const head: HeadConfig[] = [
  ['meta', { name: 'theme-color', content: '#8b5cf6' }],
  ['meta', { name: 'og:type', content: 'website' }],
  ['meta', { name: 'og:site_name', content: 'Open Short URL' }],
]

// Add GA4 scripts only if GA4_ID is configured
if (GA4_ID) {
  head.push(
    ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}` }],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}');`,
    ]
  )
}

export default withMermaid(
  defineConfig({
    title: 'Open Short URL',
    description: 'Open-source, white-label, self-hostable URL shortener platform',

    // For GitHub Pages deployment
    base: '/open-short-url/',

    // Ignore localhost links during build
    ignoreDeadLinks: [/^http:\/\/localhost/],

    markdown: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },

    head,

    // Mermaid configuration
    mermaid: {
      theme: 'default',
    },
    mermaidPlugin: {
      class: 'mermaid',
    },

    // i18n configuration
    locales: {
      en: {
        label: 'English',
        lang: 'en',
        link: '/en/',
        themeConfig: {
          nav: [
            { text: 'Guide', link: '/en/guide/introduction' },
            { text: 'Features', link: '/en/features/url-shortening' },
            { text: 'API', link: '/en/api/reference' },
            { text: 'Deployment', link: '/en/deployment/docker' },
          ],
          sidebar: {
            '/en/guide/': [
              {
                text: 'Guide',
                items: [
                  { text: 'Introduction', link: '/en/guide/introduction' },
                  { text: 'Getting Started', link: '/en/guide/getting-started' },
                  { text: 'Installation', link: '/en/guide/installation' },
                  { text: 'Configuration', link: '/en/guide/configuration' },
                ],
              },
            ],
            '/en/features/': [
              {
                text: 'Features',
                items: [
                  { text: 'URL Shortening', link: '/en/features/url-shortening' },
                  { text: 'Analytics', link: '/en/features/analytics' },
                  { text: 'A/B Testing', link: '/en/features/ab-testing' },
                  { text: 'Smart Routing', link: '/en/features/smart-routing' },
                  { text: 'Bundles', link: '/en/features/bundles' },
                  { text: 'Webhooks', link: '/en/features/webhooks' },
                  { text: 'API Keys', link: '/en/features/api-keys' },
                  { text: 'Audit Logs', link: '/en/features/audit-logs' },
                ],
              },
            ],
            '/en/api/': [
              {
                text: 'API Reference',
                items: [{ text: 'API Reference', link: '/en/api/reference' }],
              },
            ],
            '/en/deployment/': [
              {
                text: 'Deployment',
                items: [
                  { text: 'Docker', link: '/en/deployment/docker' },
                  { text: 'Self-Hosted', link: '/en/deployment/self-hosted' },
                ],
              },
            ],
          },
        },
      },
      'zh-TW': {
        label: '繁體中文',
        lang: 'zh-TW',
        link: '/zh-TW/',
        themeConfig: {
          nav: [
            { text: '指南', link: '/zh-TW/guide/introduction' },
            { text: '功能', link: '/zh-TW/features/url-shortening' },
            { text: 'API', link: '/zh-TW/api/reference' },
            { text: '部署', link: '/zh-TW/deployment/docker' },
          ],
          sidebar: {
            '/zh-TW/guide/': [
              {
                text: '指南',
                items: [
                  { text: '介紹', link: '/zh-TW/guide/introduction' },
                  { text: '快速開始', link: '/zh-TW/guide/getting-started' },
                  { text: '安裝', link: '/zh-TW/guide/installation' },
                  { text: '設定', link: '/zh-TW/guide/configuration' },
                ],
              },
            ],
            '/zh-TW/features/': [
              {
                text: '功能',
                items: [
                  { text: '短網址', link: '/zh-TW/features/url-shortening' },
                  { text: '數據分析', link: '/zh-TW/features/analytics' },
                  { text: 'A/B 測試', link: '/zh-TW/features/ab-testing' },
                  { text: '智慧路由', link: '/zh-TW/features/smart-routing' },
                  { text: '網址分組', link: '/zh-TW/features/bundles' },
                  { text: 'Webhooks', link: '/zh-TW/features/webhooks' },
                  { text: 'API 金鑰', link: '/zh-TW/features/api-keys' },
                  { text: '稽核日誌', link: '/zh-TW/features/audit-logs' },
                ],
              },
            ],
            '/zh-TW/api/': [
              {
                text: 'API 參考',
                items: [{ text: 'API 參考', link: '/zh-TW/api/reference' }],
              },
            ],
            '/zh-TW/deployment/': [
              {
                text: '部署',
                items: [
                  { text: 'Docker', link: '/zh-TW/deployment/docker' },
                  { text: '自建部署', link: '/zh-TW/deployment/self-hosted' },
                ],
              },
            ],
          },
          outlineTitle: '頁面導覽',
          docFooter: {
            prev: '上一頁',
            next: '下一頁',
          },
        },
      },
    },

    themeConfig: {
      logo: '/logo.svg',
      siteTitle: 'Open Short URL',

      socialLinks: [
        { icon: 'github', link: 'https://github.com/supra126/open-short-url' },
      ],

      search: {
        provider: 'local',
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2025-present Open Short URL Contributors',
      },
    },
  })
)
