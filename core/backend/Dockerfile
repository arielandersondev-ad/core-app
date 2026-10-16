FROM node:lts-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Compilación
FROM base AS build

COPY packages/db/package.json packages/db/package-lock.json ./packages/db/
COPY core/backend/package.json core/backend/package-lock.json ./core/backend/

RUN npm --prefix packages/db ci --include=dev \
    && npm --prefix core/backend ci --include=dev

COPY packages/db/ ./packages/db/
COPY core/backend/ ./core/backend/

RUN npm --prefix packages/db run build \
    && npm --prefix core/backend run build

# Ejecución
FROM base AS runtime

ENV NODE_ENV=production

COPY packages/db/package.json packages/db/package-lock.json ./packages/db/
COPY core/backend/package.json core/backend/package-lock.json ./core/backend/

RUN npm --prefix packages/db ci --omit=dev \
    && npm --prefix core/backend ci --omit=dev \
    && npm cache clean --force

COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/core/backend/dist ./core/backend/dist

WORKDIR /app/core/backend

USER node

EXPOSE 10000

CMD ["node", "dist/main.js"]