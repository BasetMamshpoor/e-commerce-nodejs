# ============================================================================
# Dockerfile — chat-engine
# همون الگوی بک‌اند اصلی: dev (hot reload) و production (ایمیج نهایی).
# ============================================================================

FROM node:22-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev ----
FROM deps AS dev
COPY . .
EXPOSE 8001
CMD ["npm", "run", "dev"]

# ---- build ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- production ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 8001
CMD ["node", "dist/src/main.js"]
