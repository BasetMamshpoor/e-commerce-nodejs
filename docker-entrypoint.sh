#!/bin/sh
set -e

echo "⏳ در حال اجرای migration های Prisma..."
npx prisma migrate deploy

echo "🚀 در حال اجرای سرور..."
exec "$@"
