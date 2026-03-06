# Open Short URL - MCP Server

[English](README.md) | [繁體中文](README.zh-TW.md)

> Model Context Protocol (MCP) Server for Open Short URL, enabling AI assistants to manage your short URL system.

[![npm version](https://img.shields.io/npm/v/@open-short-url/mcp.svg)](https://www.npmjs.com/package/@open-short-url/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **⚠️ Notice**: This is an early testing version v0.1.0. APIs may change. Issues and suggestions are welcome!

---

## ⚠️ Prerequisites

> **🔴 Important**: This MCP Server is a **client tool for Open Short URL** and requires connection to a deployed Open Short URL backend system.
>
> This is not a standalone short URL service, but rather manages your existing short URL system through AI applications that support the MCP protocol.

### 📋 Requirements

Before installing this MCP Server, ensure you have:

#### 1. ✅ Open Short URL Backend System (Required!)

You need to deploy the Open Short URL backend first:

- 📦 **Deploy Backend**: Deploy from the [Open Short URL main project](https://github.com/supra126/open-short-url)
- 🔧 **Ensure Running**: Backend must be running and accessible via network
- 🗄️ **Configure Database**: PostgreSQL properly configured
- 🌐 **Get URL**: Note your backend URL (e.g., `https://your-backend.com`)

> 💡 **Don't have a backend system?** Visit the [main project repository](https://github.com/supra126/open-short-url) first to learn how to deploy the backend.

#### 2. ✅ API Key

Obtain an API Key from your backend system:

1. Log in to the backend admin interface
2. Navigate to "Settings" → "API Keys"
3. Click "Create New API Key"
4. Copy the generated API Key (format: `ak_xxxxxxxxxxxxxx`)

### 🧪 Quick Connection Test

Before installation, it's recommended to test if the backend API is accessible:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-backend.com/api/urls
```

**Expected Result**: Returns a JSON list of short URLs

**If Failed**: Check:

- ✓ Backend service is running
- ✓ API URL is correct
- ✓ API Key is valid
- ✓ Firewall allows connections

---

## 🌟 Features

### URL Management

- ✅ **Create Short URLs** - Support custom slug, password protection, expiration time, UTM parameters
- 📋 **List Short URLs** - Pagination, search, filtering, sorting
- 🔍 **Query Details** - Get complete information for a single short URL
- ✏️ **Update Settings** - Modify URL, title, status, etc.
- 🗑️ **Delete URLs** - Remove short URLs and related data
- 📱 **Generate QR Code** - Generate QR codes for short URLs

### Bundle Management

- 📦 **Create Bundles** - Organize and group multiple short URLs
- 📂 **Manage Bundles** - List, query, update, delete bundles
- 🔗 **URL Association** - Add/remove URLs to/from bundles
- 📊 **Bundle Statistics** - View bundle click statistics
- 🗂️ **Archive Management** - Archive/restore bundles

### Analytics

- 📊 **Click Analysis** - Geographic location, device, browser distribution
- 📈 **Trend Analysis** - Click trends over time
- 🤖 **Bot Analysis** - Identify and analyze bot traffic
- 📝 **Recent Clicks** - View latest visitor records

### A/B Testing

- 🧪 **Create Variants** - Set up different target URLs
- ⚖️ **Traffic Distribution** - Customize traffic weights for variants
- 📊 **Performance Analysis** - Compare variant performance

---

## 🚀 Quick Start

### 1. Installation

#### Option 1: Global Install (Recommended)

```bash
npm install -g @open-short-url/mcp
```

> ⭐ **Why Recommended**: As a background service, global installation provides the best experience
>
> - ⚡ Fast startup (< 100ms)
> - 🔌 Works offline
> - 🎯 Stable and reliable

#### Option 2: Using npx (Quick Trial)

```bash
npx @open-short-url/mcp
```

> ⚠️ **Note**: Suitable for quick trials, but first startup is slower (1-5 seconds). For production use, switch to global installation.

#### Option 3: Build from Source

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url/packages/mcp
pnpm install
pnpm build
```

### 2. Get API Key

1. Log in to your Open Short URL backend system
2. Navigate to "Settings" → "API Keys"
3. Click "Create New API Key"
4. Copy the generated API Key (e.g., `ak_1234567890abcdef`)

---

## 🔧 Usage

#### Option 1: Using Global Install (Recommended) ⭐

> Requires first running: `npm install -g @open-short-url/mcp`

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

**Advantages**: ⚡ Fast startup, stable, works offline

#### Option 2: Using npx (Quick Trial)

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

**Advantages**: No installation needed, always latest
**Disadvantages**: ⚠️ Slower first startup (1-5 seconds)

#### Option 3: Using Local Build (Developers)

```json
{
  "mcpServers": {
    "open-short-url": {
      "command": "node",
      "args": ["/absolute/path/open-short-url/packages/mcp/dist/index.js"],
      "env": {
        "API_URL": "https://your-backend.com",
        "API_KEY": "ak_your_api_key_here"
      }
    }
  }
}
```

**Use Case**: Need to modify source code or debug

### Using with MCP Clients

Any application that supports the Model Context Protocol can use this MCP Server.

#### General Configuration Format

Depending on the MCP client you use, the configuration format may vary slightly, but the core elements remain the same:

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

#### Environment Variables

| Variable  | Required | Description                    | Example                    |
| --------- | -------- | ------------------------------ | -------------------------- |
| `API_URL` | ✅       | Open Short URL backend API URL | `https://your-backend.com` |
| `API_KEY` | ✅       | API Key generated by backend   | `ak_1234567890abcdef`      |

---

## 💬 Usage Examples

### Create Short URL

```
User: Shorten https://example.com/very-long-url for me

Claude: I'll create a short URL for you...
[Calling create_short_url tool]
Short URL created:
- Short URL: https://your-domain.com/abc123
- Original URL: https://example.com/very-long-url
- Clicks: 0
```

### Create Short URL with UTM Parameters

```
User: Create a short URL with UTM tracking:
- Original URL: https://example.com/product
- UTM Source: facebook
- UTM Campaign: summer-sale

Claude: Sure, I'll create it...
[Calling create_short_url tool]
Created short URL with UTM tracking:
- Short URL: https://your-domain.com/xyz789
- Redirects to: https://example.com/product?utm_source=facebook&utm_campaign=summer-sale
```

### Manage Bundles

```
User: Create a bundle called "2025 Spring Campaign" and add abc123 and xyz789 to it

Claude: Sure, I'll create the bundle...
[Calling create_bundle and add_multiple_urls_to_bundle tools]
Created bundle "2025 Spring Campaign":
- Bundle ID: bundle_abc
- Contains 2 short URLs
- Can be used for unified management and tracking of these links
```

### View Analytics

```
User: How many clicks did my short URL abc123 get this week? Which countries are they from?

Claude: Let me check...
[Calling get_url_analytics tool]
Your short URL statistics for this week:
- Total clicks: 1,234
- Top countries:
  1. Taiwan (TW): 45%
  2. United States (US): 30%
  3. Japan (JP): 15%
- Top devices:
  - Mobile: 60%
  - Desktop: 35%
  - Tablet: 5%
```

### Set Up A/B Testing

```
User: Set up A/B testing for short URL xyz789:
- 50% traffic to https://landing-a.com
- 50% traffic to https://landing-b.com

Claude: Sure, I'll set up A/B testing...
[Calling create_variant tool twice]
A/B testing configured:
- Variant A: https://landing-a.com (weight: 50%)
- Variant B: https://landing-b.com (weight: 50%)
The system will automatically distribute visitors to different pages.
```

### Generate QR Code

```
User: Generate a QR code for abc123, size 500px

Claude: Generating...
[Calling generate_qrcode tool]
QR Code generated:
- Size: 500x500 px
- Format: Base64 Data URL
- Can be embedded in web pages or downloaded for use
```

---

## 🛠️ Available Tools

### URL Management (10 tools)

1. `create_short_url` - Create short URL
2. `list_short_urls` - List all short URLs
3. `get_short_url` - Query short URL details
4. `update_short_url` - Update short URL settings
5. `delete_short_url` - Delete short URL
6. `get_url_stats` - Get URL dashboard statistics
7. `generate_qrcode` - Generate QR Code
8. `bulk_create_urls` - Bulk create short URLs (max 100)
9. `bulk_update_urls` - Bulk update short URLs (status, bundle, expiration, UTM)
10. `bulk_delete_urls` - Bulk delete short URLs

### Bundle Management (12 tools)

11. `create_bundle` - Create new bundle
12. `list_bundles` - List all bundles
13. `get_bundle` - Query bundle details
14. `update_bundle` - Update bundle information
15. `delete_bundle` - Delete bundle
16. `add_url_to_bundle` - Add single URL to bundle
17. `add_multiple_urls_to_bundle` - Batch add URLs to bundle
18. `remove_url_from_bundle` - Remove URL from bundle
19. `update_url_order_in_bundle` - Update URL order in bundle
20. `get_bundle_stats` - Get bundle statistics
21. `archive_bundle` - Archive bundle
22. `restore_bundle` - Restore archived bundle

### Analytics (8 tools)

23. `get_url_analytics` - Get URL analytics
24. `get_overview_analytics` - Get overview analytics
25. `get_top_performing_urls` - Get top performing URLs by clicks
26. `get_recent_clicks` - View recent clicks
27. `get_bot_analytics` - Bot analysis for single URL
28. `get_user_bot_analytics` - Global bot analysis
29. `get_ab_test_analytics` - A/B test analytics
30. `get_routing_analytics` - Smart routing statistics

### A/B Testing (5 tools)

31. `create_variant` - Create test variant
32. `list_variants` - List all variants
33. `get_variant` - Query variant details
34. `update_variant` - Update variant settings
35. `delete_variant` - Delete variant

**Total: 35 MCP Tools**

---

## 🔍 Troubleshooting

### MCP Server Won't Start

**Check Environment Variables**:

Verify that `API_URL` and `API_KEY` are correctly configured.

**Test API Connection**:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-backend.com/api/urls
```

### Tool Invocation Fails

1. **Check API Key** - Ensure it's valid and not expired
2. **Check Backend Service** - Ensure it's running normally
3. **Check Network Connection** - Ensure backend is reachable
4. **Check API Permissions** - Ensure API Key has sufficient permissions

### Installation Issues

**npm Installation Fails**:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm install -g @open-short-url/mcp
```

**npx Runs Slowly**:

First-time use of npx downloads the package. Switch to global installation for better performance.

---

## 🔐 Security Recommendations

### Protect API Key

- ❌ **Don't** share API Key with others
- ❌ **Don't** commit configuration files containing API Keys to Git
- ✅ Rotate API Keys regularly
- ✅ Use different API Keys for different environments
- ✅ Create dedicated API Keys with minimal permissions for MCP Server

### API Key Permission Recommendations

It's recommended to create a dedicated API Key for MCP Server with appropriate permissions:

- ✅ URL management permissions
- ✅ Bundle management permissions
- ✅ Analytics data read permissions
- ❌ System administrator permissions not needed
- ❌ User management permissions not needed

---

## 📚 Related Resources

- [Open Short URL Main Project](https://github.com/supra126/open-short-url)
- [Model Context Protocol Official Documentation](https://modelcontextprotocol.io)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
