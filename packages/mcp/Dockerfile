# ============================================================
# Open Short URL - MCP Server Dockerfile
# ============================================================
# Build from monorepo root:
#   docker build -f packages/mcp/Dockerfile .
#
# Run:
#   docker run -p 3200:3200 \
#     -e API_URL=http://backend:4101 \
#     -e API_KEY=your-api-key \
#     open-short-url-mcp
# ============================================================

# --- Stage 1: Dependencies ---
FROM node:22-slim AS deps

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/mcp/package.json packages/mcp/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @open-short-url/mcp...

# --- Stage 2: Build ---
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/mcp/node_modules ./packages/mcp/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/mcp/ packages/mcp/

WORKDIR /app/packages/mcp
RUN pnpm build

# --- Stage 3: Deploy bundle ---
FROM node:22-slim AS deployer

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY --from=builder /app ./

WORKDIR /app/packages/mcp
RUN pnpm deploy --prod /deploy

# --- Stage 4: Production ---
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_PORT=3200
ENV MCP_HOST=0.0.0.0

COPY --from=deployer --chown=node:node /deploy/dist ./dist
COPY --from=deployer --chown=node:node /deploy/package.json ./
COPY --from=deployer --chown=node:node /deploy/node_modules ./node_modules

EXPOSE 3200

USER node

CMD ["node", "dist/index.js"]
