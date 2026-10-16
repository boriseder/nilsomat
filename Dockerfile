# Multi-Stage Dockerfile für Hörbox (Node 22 LTS)
# Stage 1: Build
FROM node:22-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Dependency-Definitionen kopieren
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY e2e/package.json* ./e2e/

# Abhängigkeiten installieren
RUN pnpm install --frozen-lockfile || pnpm install

# Quellcode kopieren
COPY server ./server
COPY client ./client

# Client und Server bauen
RUN pnpm --filter client build
RUN pnpm --filter server build

# Produktions-Abhängigkeiten isolieren
RUN pnpm --filter server --prod deploy /app/server-prod

# Stage 2: Schlankes Runtime-Image
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Verzeichnis für sqlite / persistenten Zustand vorbereiten
RUN mkdir -p /data && chown -R node:node /data

# Gebaute Artefakte kopieren
COPY --from=builder --chown=node:node /app/server-prod/node_modules ./server/node_modules
COPY --from=builder --chown=node:node /app/server/dist ./server/dist
COPY --from=builder --chown=node:node /app/server/package.json ./server/package.json
COPY --from=builder --chown=node:node /app/client/dist ./client/dist

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server/dist/index.js"]
