run local:
	docker compose up -d mongo mongo-express
	cd app && npm install && npm run dev
test:
	cd app && npm run test

clean:
	docker compose down -v --remove-orphans

build:
	cd app && docker build -t chat-agent .