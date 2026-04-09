# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npm run format           # Prettier (write)
npm run format:check     # Prettier (check only)

# Testing (Vitest)
npm test                 # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8)
npx vitest run tests/unit/lib/auth.test.ts  # Run single test file

# Database (Prisma 7 + PostgreSQL)
npx prisma migrate dev   # Create + apply migration
npx prisma db push       # Push schema without migration
npx prisma studio        # Database UI
npx prisma generate      # Regenerate client after schema change
npm run db:seed          # Seed default data (admin/admin123)

# Docker
docker compose up -d     # Start PostgreSQL + app
```

## Architecture

Self-hosted AI customer support agent. Next.js 16 App Router monolith — frontend, API, and business logic in a single process.

### Layers

- **`src/app/api/`** — Thin route handlers (controllers). Validate with Zod, delegate to `src/lib/`, return standardized JSON.
- **`src/lib/`** — All business logic. No React, no Next.js imports. This is where the real work happens.
- **`src/components/`** — React UI components (Radix UI + Tailwind CSS 4).
- **`src/app/(dashboard)/`** — 19 dashboard pages. **`src/app/(auth)/`** — Login + setup wizard.
- **`src/middleware.ts`** — Edge middleware: JWT/API-key auth, rate limiting (token bucket), security headers, CORS, request IDs.
- **`prisma/schema.prisma`** — 25+ models. Generated client outputs to `src/generated/prisma`.

### Key lib/ modules

| Module | Purpose |
|--------|---------|
| `ai/engine.ts` | OpenAI conversation loop with 6 tools + guardrails |
| `channels/` | WhatsApp (Puppeteer), Email (IMAP/SMTP), Phone/SMS (Twilio), Telegram, Zalo (zca-js) |
| `conversation-engine.ts` | Routing (4 strategies), SLA enforcement, macros |
| `customer-resolver.ts` | Cross-channel identity resolution |
| `rbac.ts` | 4 roles (viewer < agent < supervisor < admin), 40+ permissions |
| `route-auth.ts` | `requireAuth(req, 'resource:action')` — the auth helper for API routes |
| `validations.ts` | Zod schemas for all 60+ endpoints |
| `errors.ts` | `AppError` — domain error factory |
| `logger.ts` | Structured logging (never use `console.log`) |
| `security.ts` | HTML escaping, CRLF sanitization, secret masking |
| `automation.ts` | Rule evaluation + execution engine |
| `webhook-delivery.ts` | HMAC-SHA256 signed, exponential retry |
| `realtime.ts` | SSE pub/sub for live updates |
| `gdpr.ts` | PII detection, data export, anonymization |

### API route pattern

```typescript
import { requireAuth } from '@/lib/route-auth'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'resource:read')
    if (!authResult.ok) return authResult.response
    // ... business logic from src/lib/
    return NextResponse.json({ data, page, limit, total })
  } catch (error) {
    logger.error('GET /api/resource failed', { error })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.toJSON() }, { status: error.status })
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 })
  }
}
```

**Response shapes**: List `{ data: T[], page, limit, total }` | Single `{ data: T }` | Error `{ error: { code, message, requestId } }`

### Auth flow

JWT in httpOnly cookie (`owly-token`) OR API key in `x-api-key` header. Middleware validates both. Public paths: `/login`, `/setup`, `/api/auth/*`, `/api/health`. Channel webhook paths (Twilio, Telegram) bypass JWT — verified by provider signature.

## Code Conventions

- **Path alias**: `@/*` maps to `src/*`
- **File naming**: kebab-case (e.g., `customer-resolver.ts`). React components: PascalCase export, kebab-case file.
- **Max file size**: 200 lines. Split larger files into focused modules.
- **TypeScript strict mode**. No `any`, no `!` assertions, no `as` casting.
- **Zod validation** on all API inputs. Schemas live in `src/lib/validations.ts`.
- **Structured logging** via `src/lib/logger.ts`. Never `console.log`.
- **Commits**: `type(scope): description` — types: `feat`, `fix`, `security`, `refactor`, `test`, `chore`, `docs`, `ci`

## Testing

- **Framework**: Vitest 4, node environment, globals enabled
- **Structure**: `tests/unit/` (lib modules), `tests/api/` (endpoints), `tests/security/` (XSS, CRLF, secrets)
- **Coverage scope**: `src/lib/**`, `src/app/api/**`, `src/middleware.ts` — excludes components and pages
- **Test files** mirror src paths: `tests/unit/lib/auth.test.ts` tests `src/lib/auth.ts`

## Environment

Required: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`. See `.env.example` for all variables. Prisma client generated to `src/generated/prisma` — run `npx prisma generate` after schema changes.
