---
layout: home
hero:
  name: Open Short URL
  text: 文件
  tagline: 了解如何設定與使用 Open Short URL
  image:
    src: /logo.svg
    alt: Open Short URL
  actions:
    - theme: brand
      text: 快速開始
      link: /zh-TW/guide/getting-started
    - theme: alt
      text: API 參考
      link: /zh-TW/api/reference

features:
  - icon: 📖
    title: 指南
    details: 介紹、安裝與設定說明
    link: /zh-TW/guide/introduction
    linkText: 閱讀指南
  - icon: ⚡
    title: 功能
    details: 短網址、數據分析、A/B 測試、智慧路由
    link: /zh-TW/features/url-shortening
    linkText: 探索功能
  - icon: 🔌
    title: API
    details: REST API 參考與認證方式
    link: /zh-TW/api/reference
    linkText: 查看 API 文件
  - icon: 🚀
    title: 部署
    details: Docker 與自建部署指南
    link: /zh-TW/deployment/docker
    linkText: 立即部署
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, #8b5cf6 20%, #6366f1 80%);
  --vp-home-hero-image-filter: blur(56px);
}

.VPHero .VPImage {
  max-width: 120px;
  max-height: 120px;
}

.VPFeatures .VPFeature {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.15);
}
</style>
