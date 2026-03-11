# Game Backlog Manager

A portfolio-grade MVP that demonstrates a production-style architecture: a React frontend, a Fastify API gateway, and dedicated backend services for game search and backlog management. The app integrates the RAWG API, persists user data in PostgreSQL, and uses JWT-based authentication with service boundaries.

## Highlights
- API Gateway with JWT auth, rate limiting, and request routing
- Microservice split: `games-service` (RAWG integration + caching) and `backlog-service` (PostgreSQL persistence)
- Full CRUD for backlog entries with status and rating
- Stats and showcase tiles for top-rated completed games
- Dockerized local environment

## Tech Stack
**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Fastify
- JWT auth
- Zod validation
- Prisma ORM

**Infrastructure**
- PostgreSQL
- Docker + Docker Compose

## Screenshots
![Search and add to backlog](shared/Screenshot%202026-03-11%20043613.png)
![Backlog with filters and covers](shared/Screenshot%202026-03-11%20043817.png)
![Stats and completed highlights](shared/Screenshot%202026-03-11%20043902.png)

## Quick Start
1. Add your keys to `.env`:
   - `RAWG_API_KEY=...`
   - `JWT_SECRET=...`
2. Run the stack:
   ```powershell
   docker compose up --build
   ```
3. Open:
   - Frontend: `http://localhost:5173`
   - Gateway health: `http://localhost:3000/health`

## Architecture
```
React Frontend
      |
      v
Fastify API Gateway
  |           |
  v           v
games-service backlog-service
   |              |
  RAWG          PostgreSQL
```
