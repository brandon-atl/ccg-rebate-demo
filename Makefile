.PHONY: bootstrap wire db dev build quality deploy

bootstrap:
	bash scripts/bootstrap.sh

wire:
	bash scripts/wire_railway.sh "$(DATABASE_URL)"

db:
	python etl/reset_and_seed.py

dev:
	npm run dev

build:
	npm run build

quality:
	python etl/run_sql.py sql/03_quality_checks.sql

deploy:
	bash scripts/vercel_deploy.sh
