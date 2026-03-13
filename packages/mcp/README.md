# Open Short URL - MCP Server

[English](README.md) | [繁體中文](README.zh-TW.md)

> Model Context Protocol (MCP) Server for Open Short URL, enabling AI assistants to manage your short URL system.

[![npm version](https://img.shields.io/npm/v/@open-short-url/mcp.svg)](https://www.npmjs.com/package/@open-short-url/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Prerequisites

> **Important**: This MCP Server is a **client tool for Open Short URL** and requires connection to a deployed Open Short URL backend system.
>
> This is not a standalone short URL service, but rather manages your existing short URL system through AI applications that support the MCP protocol.

### Requirements

#### 1. Open Short URL Backend System (Required)

You need to deploy the Open Short URL backend first:

- Deploy from the [Open Short URL main project](https://github.com/supra126/open-short-url)
- Backend must be running and accessible via network
- Note your backend URL (e.g., `https://your-backend.com`)

> Don't have a backend system? Visit the [main project repository](https://github.com/supra126/open-short-url) first.

#### 2. API Key

Obtain an API Key from your backend system:

1. Log in to the backend admin interface
2. Navigate to "Settings" → "API Keys"
3. Click "Create New API Key"
4. Copy the generated API Key (format: `ak_xxxxxxxxxxxxxx`)

### Quick Connection Test

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-backend.com/api/urls
```

---

## Features

**77 MCP Tools** across 11 modules:

| Module | Tools | Description |
|--------|-------|-------------|
| URL Management | 10 | Create, list, update, delete, QR code, bulk operations |
| Bundle Management | 12 | Group URLs, reorder, archive/restore, statistics |
| Analytics | 10 | Click analysis, trends, bot detection, data export |
| A/B Testing | 5 | Create variants, traffic distribution, performance comparison |
| Smart Routing | 8 | Conditional routing rules, templates, geo/device targeting |
| Webhooks | 7 | Event notifications, delivery logs, webhook testing |
| User Management | 11 | Create/manage users, roles, 2FA, OIDC accounts |
| API Keys | 4 | Create, list, view, revoke API keys |
| OIDC/SSO | 5 | Manage OIDC/SSO identity providers |
| System Settings | 4 | View and manage system configuration |
| Audit Logs | 1 | Query system audit trail |

### Security

- **Sensitive data sanitization** — API keys, tokens, passwords are automatically redacted in all responses
- **Destructive tool marking** — Delete/reset operations are prefixed with `[DESTRUCTIVE]` and include confirmation hints for the AI assistant
- **Error message cleaning** — Credentials are stripped from error outputs

---

## Quick Start

### Transport Modes

The MCP server supports two transport modes:

| Mode | Use Case | Protocol |
|------|----------|----------|
| **stdio** (default) | CLI and IDE integrations (Claude Desktop, VS Code, etc.) | Standard I/O |
| **http** | Remote access, containerized deployments, multi-client | Streamable HTTP |

### Option 1: npm (stdio)

#### Global Install (Recommended)

```bash
npm install -g @open-short-url/mcp
```

#### Using npx

```bash
npx @open-short-url/mcp
```

#### MCP Client Configuration

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

### Option 2: Docker (HTTP)

```bash
docker run -p 3200:3200 \
  -e API_URL=http://your-backend:4101 \
  -e API_KEY=ak_your_api_key_here \
  ghcr.io/supra126/open-short-url-mcp:latest
```

The server will be available at `http://localhost:3200/mcp`.

#### Health Check

```bash
curl http://localhost:3200/health
```

### Option 3: Docker Compose

Add the `mcp` profile to your existing Open Short URL deployment:

```bash
docker compose --profile mcp up -d
```

Set `MCP_API_KEY` in your `.env.docker` file. See the main project's `docker-compose.yml` for full configuration.

### Option 4: Build from Source

```bash
git clone https://github.com/supra126/open-short-url.git
cd open-short-url/packages/mcp
pnpm install && pnpm build

# stdio mode
API_URL=https://your-backend.com API_KEY=ak_xxx node dist/index.js

# HTTP mode
MCP_TRANSPORT=http API_URL=https://your-backend.com API_KEY=ak_xxx node dist/index.js
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | Yes | — | Open Short URL backend API URL |
| `API_KEY` | Yes | — | API key for authentication |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode: `stdio` or `http` |
| `MCP_PORT` | No | `3200` | HTTP server port (http mode only) |
| `MCP_HOST` | No | `0.0.0.0` | HTTP bind address (http mode only) |

---

## Available Tools (77)

### URL Management (10)

| Tool | Description |
|------|-------------|
| `create_short_url` | Create short URL with custom slug, password, expiration, UTM |
| `list_short_urls` | List all short URLs with pagination, search, filtering |
| `get_short_url` | Get short URL details |
| `update_short_url` | Update short URL settings |
| `delete_short_url` | Delete short URL [DESTRUCTIVE] |
| `get_url_stats` | Get URL dashboard statistics |
| `generate_qrcode` | Generate QR code for a short URL |
| `bulk_create_urls` | Bulk create short URLs (max 100) |
| `bulk_update_urls` | Bulk update short URLs |
| `bulk_delete_urls` | Bulk delete short URLs [DESTRUCTIVE] |

### Bundle Management (12)

| Tool | Description |
|------|-------------|
| `create_bundle` | Create new bundle |
| `list_bundles` | List all bundles |
| `get_bundle` | Get bundle details |
| `update_bundle` | Update bundle information |
| `delete_bundle` | Delete bundle [DESTRUCTIVE] |
| `add_url_to_bundle` | Add single URL to bundle |
| `add_multiple_urls_to_bundle` | Batch add URLs to bundle |
| `remove_url_from_bundle` | Remove URL from bundle |
| `update_url_order_in_bundle` | Reorder URLs in bundle |
| `get_bundle_stats` | Get bundle statistics |
| `archive_bundle` | Archive bundle |
| `restore_bundle` | Restore archived bundle |

### Analytics (10)

| Tool | Description |
|------|-------------|
| `get_url_analytics` | URL click analytics (geo, device, browser) |
| `get_overview_analytics` | Overview analytics dashboard |
| `get_top_performing_urls` | Top performing URLs by clicks |
| `get_recent_clicks` | Recent click records |
| `get_bot_analytics` | Bot analysis for single URL |
| `get_user_bot_analytics` | Global bot analysis |
| `get_ab_test_analytics` | A/B test analytics |
| `get_routing_analytics` | Smart routing statistics |
| `export_url_analytics` | Export single URL analytics (CSV/JSON) |
| `export_all_analytics` | Export all analytics data (CSV/JSON) |

### A/B Testing (5)

| Tool | Description |
|------|-------------|
| `create_variant` | Create test variant |
| `list_variants` | List all variants |
| `get_variant` | Get variant details |
| `update_variant` | Update variant settings |
| `delete_variant` | Delete variant [DESTRUCTIVE] |

### Smart Routing (8)

| Tool | Description |
|------|-------------|
| `create_routing_rule` | Create conditional routing rule |
| `create_routing_rule_from_template` | Create rule from template (geo, device, etc.) |
| `list_routing_rules` | List routing rules for a URL |
| `get_routing_rule` | Get routing rule details |
| `update_routing_rule` | Update routing rule |
| `delete_routing_rule` | Delete routing rule [DESTRUCTIVE] |
| `update_smart_routing_settings` | Update routing settings for a URL |
| `list_routing_templates` | List available routing templates |

### Webhooks (7)

| Tool | Description |
|------|-------------|
| `create_webhook` | Create webhook endpoint |
| `list_webhooks` | List all webhooks |
| `get_webhook` | Get webhook details |
| `update_webhook` | Update webhook settings |
| `delete_webhook` | Delete webhook [DESTRUCTIVE] |
| `get_webhook_logs` | View webhook delivery logs |
| `test_webhook` | Send test webhook event |

### User Management (11)

| Tool | Description |
|------|-------------|
| `create_user` | Create new user |
| `list_users` | List all users |
| `get_user` | Get user details |
| `update_user_role` | Update user role |
| `update_user_status` | Activate/deactivate user |
| `update_user_name` | Update user display name |
| `delete_user` | Delete user [DESTRUCTIVE] |
| `reset_user_password` | Reset user password [DESTRUCTIVE] |
| `disable_user_2fa` | Disable user 2FA [DESTRUCTIVE] |
| `get_user_oidc_accounts` | List user's linked OIDC accounts |
| `unlink_user_oidc_account` | Unlink OIDC account [DESTRUCTIVE] |

### API Keys (4)

| Tool | Description |
|------|-------------|
| `create_api_key` | Create new API key (shown once, then redacted) |
| `list_api_keys` | List all API keys |
| `get_api_key` | Get API key details |
| `delete_api_key` | Revoke API key [DESTRUCTIVE] |

### OIDC/SSO Providers (5)

| Tool | Description |
|------|-------------|
| `list_oidc_providers` | List OIDC providers |
| `create_oidc_provider` | Create OIDC provider |
| `get_oidc_provider` | Get OIDC provider details |
| `update_oidc_provider` | Update OIDC provider |
| `delete_oidc_provider` | Delete OIDC provider [DESTRUCTIVE] |

### System Settings (4)

| Tool | Description |
|------|-------------|
| `get_system_settings` | Get all system settings |
| `get_system_setting` | Get a single setting by key |
| `update_system_setting` | Update a system setting |
| `delete_system_setting` | Delete a system setting [DESTRUCTIVE] |

### Audit Logs (1)

| Tool | Description |
|------|-------------|
| `get_audit_logs` | Query audit logs with filtering |

---

## Troubleshooting

### MCP Server Won't Start

1. Verify `API_URL` and `API_KEY` are set
2. Test API connection:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://your-backend.com/api/urls
   ```

### Tool Invocation Fails

1. Check API Key is valid and not expired
2. Check backend service is running
3. Check network connectivity
4. Check API Key has sufficient permissions

### Docker Container Issues

1. Ensure `API_URL` uses the Docker network hostname (e.g., `http://backend:4101`) not `localhost`
2. Check container logs: `docker logs <container-id>`
3. Verify health endpoint: `curl http://localhost:3200/health`

---

## Security Recommendations

- Do not share or commit API Keys to Git
- Rotate API Keys regularly
- Use separate API Keys for different environments
- Create dedicated API Keys with minimal permissions for MCP Server
- The MCP server automatically redacts sensitive data (keys, tokens, passwords) in all responses

---

## Related Resources

- [Open Short URL Main Project](https://github.com/supra126/open-short-url)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.
