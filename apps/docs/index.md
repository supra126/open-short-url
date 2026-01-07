---
layout: home
hero:
  name: Open Short URL
  text: Self-Hostable URL Shortener
  tagline: A powerful, open-source URL shortening platform with analytics, A/B testing, smart routing, and more. Deploy on your own infrastructure with full control.
  image:
    src: /logo.svg
    alt: Open Short URL
  actions:
    - theme: brand
      text: English Documentation
      link: /en/
    - theme: alt
      text: 繁體中文文件
      link: /zh-TW/

features:
  - icon: 🔗
    title: URL Shortening
    details: Create short, memorable URLs with custom slugs, password protection, and expiration settings.
  - icon: 📊
    title: Real-time Analytics
    details: Track clicks, geographic locations, devices, browsers, and referrers with detailed dashboards.
  - icon: 🧪
    title: A/B Testing
    details: Split traffic between different destinations with weighted distribution to optimize conversions.
  - icon: 🎯
    title: Smart Routing
    details: Route visitors based on device type, location, language, time, and custom rules.
  - icon: 📦
    title: URL Bundles
    details: Organize and group your short URLs for better management and bulk operations.
  - icon: 🔔
    title: Webhooks
    details: Get real-time notifications when URLs are clicked, created, or updated.
  - icon: 🔑
    title: API Access
    details: Full REST API with API key authentication for seamless integrations.
  - icon: 🚀
    title: Self-Hosted
    details: Deploy with Docker or manually. Full control over your data and infrastructure.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, #8b5cf6 20%, #6366f1 80%);
  --vp-home-hero-image-filter: blur(56px);
}

.VPHero .VPImage {
  max-width: 180px;
  max-height: 180px;
}

.VPFeatures .VPFeature {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.15);
}
</style>
