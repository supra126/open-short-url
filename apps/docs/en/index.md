---
layout: home
hero:
  name: Open Short URL
  text: Documentation
  tagline: Learn how to set up and use Open Short URL
  image:
    src: /logo.svg
    alt: Open Short URL
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: API Reference
      link: /en/api/reference

features:
  - icon: 📖
    title: Guide
    details: Introduction, installation, and configuration
    link: /en/guide/introduction
    linkText: Read Guide
  - icon: ⚡
    title: Features
    details: URL shortening, analytics, A/B testing, smart routing
    link: /en/features/url-shortening
    linkText: Explore Features
  - icon: 🔌
    title: API
    details: REST API reference and authentication
    link: /en/api/reference
    linkText: View API Docs
  - icon: 🚀
    title: Deployment
    details: Docker and self-hosted deployment guides
    link: /en/deployment/docker
    linkText: Deploy Now
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
