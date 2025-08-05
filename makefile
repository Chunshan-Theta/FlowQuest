run local:
	docker compose up -d mongo
	cd app && npm install && npm run dev
test:
	cd app && npm run test