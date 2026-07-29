# Phase 1 Decisions

This document locks the first set of architecture choices for the roadmap.

The goal of Phase 1 is not to implement code. It is to remove ambiguity so the later phases can be built in a consistent order.

## Decisions

### 1. The existing `gateway` will become the GraphQL edge

The current gateway is already the public entry point for the app, so it is the best place to expose GraphQL.

Why this choice works:

- it keeps one clear client-facing entry point
- it preserves the existing gateway boundary
- it avoids adding a separate API composition service just to host GraphQL

Target role:

- auth boundary
- GraphQL API composition layer
- request orchestration to internal services

### 2. The Go service will own concurrent aggregation and enrichment

The Go service should be the part of the system that most clearly demonstrates goroutines, channels, scheduling, and cancellation.

Recommended responsibility:

- gather and merge data from multiple internal or external sources
- run parallel I/O work
- enrich game or backlog data for the GraphQL layer

Why this choice works:

- it naturally benefits from concurrency
- it gives you a real story for goroutines and channels
- it is easy to explain in an interview

Target examples:

- fan out multiple requests in parallel
- collect results through channels
- cancel outstanding work when the request context is done

### 3. The Java service will own notifications and reporting

The Java service should have a different job from the Go service so the architecture shows true service separation.

Recommended responsibility:

- consume events from RabbitMQ
- build notifications or reports
- persist reporting state where needed

Why this choice works:

- it gives Java a real domain role
- it fits an asynchronous event-driven style
- it stays separate from the Go concurrency story

### 4. PostgreSQL remains the source of truth for durable application state

The current `backlog-service` already owns the core user/game/backlog persistence model, so it should remain the primary database owner unless a later phase explicitly moves that responsibility.

Why this choice works:

- minimal disruption to the existing app
- clear ownership of transactional data
- no need to re-home the current schema immediately

Target rule:

- services may read derived data for composition
- only one service should own writes for a given dataset

### 5. RabbitMQ will carry business events between services

RabbitMQ should be used for asynchronous events, not for everything.

Recommended event examples:

- `backlog.item.created`
- `backlog.item.updated`
- `game.enrichment.requested`
- `game.enrichment.completed`
- `notification.send.requested`
- `report.refresh.requested`

Why this choice works:

- it makes the system feel distributed
- it avoids tight synchronous coupling
- it gives both new backend services meaningful work

### 6. The frontend will continue to talk only to the gateway

The frontend should not know which backend service owns which piece of data.

Why this choice works:

- simpler client code
- easier authentication handling
- GraphQL can provide a single view of the data

## Service Responsibility Summary

| Service | Responsibility | Primary Job |
| --- | --- | --- |
| `frontend` | UI | Render the app and send GraphQL operations |
| `gateway` | API edge | Auth, GraphQL composition, request orchestration |
| `games-service` | Existing domain service | Current RAWG-backed game search and read support |
| `backlog-service` | Existing domain service | PostgreSQL-backed backlog persistence |
| Go service | Concurrent backend worker | Parallel aggregation and enrichment |
| Java service | Async domain worker | Notifications and reporting |

## Interaction Model

### Read path

1. The frontend sends a GraphQL query to the gateway.
2. The gateway resolves the query by calling the relevant backend service or services.
3. The response is assembled into a single payload for the client.

### Write path

1. The frontend sends a GraphQL mutation to the gateway.
2. The gateway forwards the command to the owning service.
3. The owning service persists the change in PostgreSQL.
4. The owning service publishes a RabbitMQ event.
5. Other services react asynchronously.

### Background processing path

1. A service consumes a message from RabbitMQ.
2. It performs the work without blocking the user request.
3. It writes any durable result to PostgreSQL or emits another event.

## What This Phase Establishes

Phase 1 gives us the boundaries we need before implementation begins:

- where GraphQL lives
- what the Go service is for
- what the Java service is for
- which service owns persistent writes
- which events should move across RabbitMQ

Once these are agreed, the later phases can focus on implementation instead of design churn.

