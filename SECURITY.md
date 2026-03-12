# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | ✅ Active support  |
| < 1.4   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability in Open Short URL, please report it responsibly. **Do not open a public issue.**

### How to Report

1. **Email**: Send details to [supra126@gmail.com](mailto:supra126@gmail.com)
2. **Subject**: `[SECURITY] <brief description>`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected version(s)
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Status update**: Within 7 days with an assessment
- **Resolution**: Security patches are prioritized and released as soon as possible

### Scope

The following are in scope for security reports:

- Authentication & authorization bypasses
- SQL injection, XSS, CSRF, SSRF
- Sensitive data exposure
- URL redirect manipulation
- API key / webhook secret leakage
- Rate limiting bypasses
- OIDC/SSO vulnerabilities
- Docker image vulnerabilities

### Out of Scope

- Vulnerabilities in third-party dependencies (report to the upstream project)
- Social engineering attacks
- Denial of service (DoS) attacks
- Issues in demo/staging environments

## Security Best Practices for Self-Hosting

- Always use HTTPS (Caddy profile provides built-in SSL)
- Set strong `JWT_SECRET` and `ENCRYPTION_KEY` values
- Enable 2FA for admin accounts
- Restrict CORS origins in production (`CORS_ORIGINS`)
- Use environment variables for all secrets — never commit `.env` files
- Keep your instance updated to the latest version
- Enable rate limiting in production
- Use a dedicated PostgreSQL user with minimal privileges

## Acknowledgments

We appreciate responsible disclosure and will credit reporters in release notes (unless you prefer to remain anonymous).
