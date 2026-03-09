FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN corepack pnpm install
RUN corepack pnpm --filter backlog-service prisma generate

CMD ["sh", "-c", "corepack pnpm --filter backlog-service prisma migrate deploy && corepack pnpm --filter backlog-service dev"]
