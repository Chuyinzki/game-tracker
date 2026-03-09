FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN corepack pnpm install

CMD ["sh", "-c", "corepack pnpm --filter games-service dev"]
