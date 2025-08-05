run local:
	docker compose up -d mongo
	cd app && npm install && npm run dev
