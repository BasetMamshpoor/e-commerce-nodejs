# ============================================================================
# Dockerfile — بک‌اند اصلی فروشگاه
# چند stage داره: dev (برای توسعه‌ی لوکال با hot reload) و production
# (ایمیج نهایی و سبک برای سرور). کدوم stage استفاده میشه رو
# docker-compose.yml / docker-compose.override.yml مشخص می‌کنه.
# ============================================================================

FROM node:22-alpine AS base
WORKDIR /app

# ---- deps: فقط نصب پکیج‌ها، جدا از کد، تا این لایه کش بمونه ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: کل کد رو کپی می‌کنه، ولی docker-compose.override.yml روی این
#      volume mount می‌کنه تا تغییرات لحظه‌ای دیده بشن ----
FROM deps AS dev
COPY . .
RUN npx prisma generate
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ---- build: کامپایل TypeScript + تولید Prisma Client برای production ----
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- production: ایمیج نهایی، فقط با فایل‌های لازم ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && mkdir -p uploads

EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
