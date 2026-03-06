# ============================================================
# Open Short URL - Frontend Dockerfile
# ============================================================
# Build from monorepo root:
#   docker build -f apps/frontend/Dockerfile .
#
# NEXT_PUBLIC_* env vars can be overridden at runtime.
# Build uses placeholders; entrypoint.sh replaces them on startup.
# ============================================================

# --- Stage 1: Dependencies ---
FROM node:22-slim AS deps

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/mcp/package.json packages/mcp/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter frontend...

# --- Stage 2: Build ---
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/packages/mcp/node_modules ./packages/mcp/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/mcp/ packages/mcp/
COPY apps/frontend/ apps/frontend/

# Build MCP package first (workspace dependency)
RUN pnpm --filter @open-short-url/mcp build

# Build with placeholders (replaced at runtime by entrypoint.sh)
# When building from source, override these ARGs with actual values
ARG NEXT_PUBLIC_API_URL=__NEXT_PUBLIC_API_URL__
ARG NEXT_PUBLIC_SHORT_URL_DOMAIN=__NEXT_PUBLIC_SHORT_URL_DOMAIN__
ARG NEXT_PUBLIC_LOCALE=__NEXT_PUBLIC_LOCALE__
ARG NEXT_PUBLIC_BRAND_NAME=__NEXT_PUBLIC_BRAND_NAME__
ARG NEXT_PUBLIC_BRAND_ICON_URL=__NEXT_PUBLIC_BRAND_ICON_URL__
ARG NEXT_PUBLIC_BRAND_DESCRIPTION=__NEXT_PUBLIC_BRAND_DESCRIPTION__
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=__NEXT_PUBLIC_TURNSTILE_SITE_KEY__

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SHORT_URL_DOMAIN=$NEXT_PUBLIC_SHORT_URL_DOMAIN
ENV NEXT_PUBLIC_LOCALE=$NEXT_PUBLIC_LOCALE
ENV NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME
ENV NEXT_PUBLIC_BRAND_ICON_URL=$NEXT_PUBLIC_BRAND_ICON_URL
ENV NEXT_PUBLIC_BRAND_DESCRIPTION=$NEXT_PUBLIC_BRAND_DESCRIPTION
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

WORKDIR /app/apps/frontend
RUN mkdir -p public
RUN pnpm build

# --- Stage 3: Production ---
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY apps/frontend/entrypoint.sh ./apps/frontend/entrypoint.sh

RUN chmod +x ./apps/frontend/entrypoint.sh
RUN chown -R node:node /app
USER node

ENV PORT=4100
EXPOSE 4100

CMD ["sh", "apps/frontend/entrypoint.sh"]
