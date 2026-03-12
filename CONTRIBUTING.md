# Contributing to Open Short URL

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- **Node.js** >= 22
- **pnpm** 10.30.3+ (enforced via `packageManager` field)
- **PostgreSQL** (local or Docker)
- **Redis** (optional, for caching)

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/open-short-url.git
cd open-short-url
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Infrastructure (PostgreSQL & Redis)

The quickest way to get the required services running:

```bash
docker compose -f docker-compose.quickstart.yml up -d postgres redis
```

This starts PostgreSQL and Redis with pre-configured credentials — no manual setup needed.

### 4. Set Up Environment

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Update `apps/backend/.env` to match the quickstart database:

```env
DATABASE_URL=postgresql://postgres:quickstart-not-for-production@localhost:5432/open_short_url?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 5. Set Up Database

```bash
pnpm prisma:migrate
```

### 6. Start Development

```bash
# Run both backend and frontend (with hot-reload)
pnpm dev

# Or run individually
pnpm dev:backend    # NestJS on default port
pnpm dev:frontend   # Next.js on port 4100
```

## Project Structure

```
open-short-url/
├── apps/
│   ├── backend/       # NestJS API server
│   ├── frontend/      # Next.js web app
│   └── docs/          # VitePress documentation site
├── packages/
│   └── mcp/           # MCP server package
├── scripts/           # Setup & utility scripts
└── docs/              # Static documentation
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feat/your-feature
# or
git checkout -b fix/your-bugfix
```

### 2. Make Your Changes

Follow the code style conventions below, then verify your changes:

```bash
pnpm lint          # ESLint across all packages
pnpm type-check    # TypeScript validation
pnpm build         # Full build
```

All three must pass before submitting a PR.

### 3. Commit Your Changes

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug in URL redirect
docs: update API documentation
chore: bump dependency versions
refactor: restructure analytics module
```

Commit messages are enforced by **commitlint** via Husky git hooks.

### 4. Submit a Pull Request

- Push your branch and open a PR against `main`
- Describe what your changes do and why
- Reference related issues (e.g., `Fixes #123`)
- Ensure CI checks pass (lint, type-check, build, env-sync)

## Code Style

### General

- **Language**: TypeScript (strict mode)
- **Formatter**: Prettier
- **Linter**: ESLint

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files & directories | kebab-case | `url-analytics.service.ts` |
| Classes | PascalCase | `UrlAnalyticsService` |
| Functions & variables | camelCase | `getUrlStats` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types & interfaces | PascalCase | `UrlResponse` |

### Import Order

1. Node.js built-in modules
2. External packages (e.g., `@nestjs/*`, `react`)
3. Internal packages (e.g., `@open-short-url/mcp`)
4. Relative imports

### Backend (NestJS)

- Use decorators for validation, guards, and interceptors
- Handle errors with NestJS exception filters
- Use Prisma for all database operations

### Frontend (Next.js)

- Use React Query for server state management
- Use Zustand for client state
- Use Radix UI + Tailwind CSS for components
- Invalidate related query caches in mutation `onSuccess` callbacks

## Reporting Bugs

Open an issue with:

- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)

## Requesting Features

Open an issue with:

- Problem description (what and why)
- Proposed solution
- Alternatives considered

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before participating.

## Questions?

Open a [GitHub Discussion](https://github.com/supra126/open-short-url/discussions) or reach out via [Issues](https://github.com/supra126/open-short-url/issues).
