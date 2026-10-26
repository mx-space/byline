# syntax=docker/dockerfile:1.7

FROM node:26-alpine AS builder
ENV REDISMS_DISABLE_POSTINSTALL=1
ENV MONGOMS_DISABLE_POSTINSTALL=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apk add --no-cache git python3 make g++ bash
# Node.js 26 images no longer ship corepack.
RUN npm i -g corepack@0.36.0 && corepack enable
WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -C apps/server run bundle
RUN pnpm -C apps/admin run build

RUN mkdir -p /out/admin \
  && cp -R apps/server/out/. /out/ \
  && cp -R apps/server/src/database/migrations /out/migrations \
  && cp -R apps/admin/dist/. /out/admin/ \
  && node -p "require('./apps/admin/package.json').version" > /out/admin/version

FROM node:26-alpine AS runner

RUN apk add --no-cache bash curl tini postgresql-client

WORKDIR /app
COPY --from=builder /out .

# The bundle keeps sharp (native), ws (loaded through createRequire by the
# Nest WsAdapter) and loro-crdt (reads its wasm glue files next to itself)
# external, so they are installed next to it.
RUN npm i --no-save --no-package-lock sharp@0.35.5 ws@8.22.0 loro-crdt@1.17.1 \
  && npm cache clean --force

COPY --chmod=755 docker-entrypoint.sh .

ENV NODE_ENV=production
ENV PORT=2333
ENV MIGRATIONS_DIR=/app/migrations
ENV ADMIN_ASSET_DIR=/app/admin
# Optional native deps (sharp) are resolved from the data dir at runtime;
# NODE_PATH lets that lookup find the copy installed next to the bundle.
ENV NODE_PATH=/app/node_modules

EXPOSE 2333

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/v3/health" > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]
