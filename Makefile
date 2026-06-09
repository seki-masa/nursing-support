.PHONY: up down build logs shell migrate migrate-deploy seed studio reset

up:
	docker-compose up -d
	@echo "✅ アプリ起動完了: http://localhost:3000"

down:
	docker-compose down

build:
	docker-compose build --no-cache

logs:
	docker-compose logs -f app

shell:
	docker-compose exec app sh

# 新しいマイグレーションを作成して適用（例: make migrate name=add_xxx）
migrate:
	docker-compose exec app npx prisma migrate dev --name $(name)

# 未適用のマイグレーションを適用（本番相当）
migrate-deploy:
	docker-compose exec app npx prisma migrate deploy

seed:
	docker-compose exec app npx tsx prisma/seed.ts

studio:
	docker-compose exec app npx prisma studio --port 5555 --hostname 0.0.0.0

# DBをマイグレーションで作り直してシード再投入
reset:
	docker-compose exec app npx prisma migrate reset --force --skip-seed
	docker-compose exec app npx tsx prisma/seed.ts
