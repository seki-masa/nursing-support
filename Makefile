.PHONY: up down build logs shell migrate seed studio reset

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

migrate:
	docker-compose exec app npx prisma db push

seed:
	docker-compose exec app npx tsx prisma/seed.ts

studio:
	docker-compose exec app npx prisma studio --port 5555 --hostname 0.0.0.0

reset:
	docker-compose exec app npx prisma db push --force-reset
	docker-compose exec app npx tsx prisma/seed.ts
