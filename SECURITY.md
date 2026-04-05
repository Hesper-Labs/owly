# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please send an email to the maintainers or use [GitHub's private vulnerability reporting](https://github.com/Hesper-Labs/owly/security/advisories/new).

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix and disclosure:** Coordinated with reporter

## Security Best Practices for Deployment

- Change the default `JWT_SECRET` and `NEXTAUTH_SECRET` in `.env`
- Use HTTPS in production (reverse proxy with Nginx/Caddy)
- Keep API keys encrypted and never commit `.env` files
- Regularly update dependencies (`npm audit`)
- Restrict database access to localhost or trusted IPs
- Use strong passwords for the admin account
