#!/bin/sh
set -e

echo "==> データベースマイグレーションを適用中..."
npx prisma migrate deploy

echo "==> 初期データを確認・投入中..."
npx tsx prisma/seed.ts

echo "==> Next.js 開発サーバーを起動中..."
exec "$@"
