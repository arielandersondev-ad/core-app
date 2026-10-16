FROM node:lts-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Compilación
FROM base AS build

COPY packages/db/package.json packages/db/package-lock.json ./packages/db/
COPY dentistry/backend/package.json dentistry/backend/package-lock.json ./dentistry/backend/

RUN npm --prefix packages/db ci --include=dev \
    && npm --prefix dentistry/backend ci --include=dev

COPY packages/db/ ./packages/db/
COPY dentistry/backend/ ./dentistry/backend/

RUN npm --prefix packages/db run build \
    && npm --prefix dentistry/backend run build

# Ejecución
FROM base AS runtime

ENV NODE_ENV=production

COPY packages/db/package.json packages/db/package-lock.json ./packages/db/
COPY dentistry/backend/package.json dentistry/backend/package-lock.json ./dentistry/backend/

RUN npm --prefix packages/db ci --omit=dev \
    && npm --prefix dentistry/backend ci --omit=dev \
    && npm cache clean --force

COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/dentistry/backend/dist ./dentistry/backend/dist

WORKDIR /app/dentistry/backend

USER node

EXPOSE 10000

CMD ["node", "dist/main.js"]