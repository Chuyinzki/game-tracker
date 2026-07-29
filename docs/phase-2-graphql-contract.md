# Phase 2 Decisions: GraphQL Contract

This document defines the first GraphQL contract for the project.

The goal is to create a stable client-facing API shape before any implementation work begins.

## Decision

### The existing `gateway` will expose the GraphQL API

The gateway is already the public entry point for the app, so it should own GraphQL as well.

This keeps the architecture simple:

- the frontend talks to one place
- the gateway remains the auth and composition layer
- backend services stay hidden behind the gateway

## Contract Goals

The initial schema should:

- match the current frontend needs
- map cleanly to the current REST-backed services
- support future aggregation from Go and Java services
- keep auth on the gateway

## Recommended Schema Shape

### Scalars and enums

Use standard GraphQL scalars for the basic data and an enum for backlog state.

```graphql
enum BacklogStatus {
  WANT_TO_PLAY
  PLAYING
  COMPLETED
  ABANDONED
}
```

### Core object types

The schema should expose types that line up with the current UI and API payloads.

```graphql
type User {
  id: ID!
  email: String!
}

type AuthPayload {
  token: String!
  user: User!
}

type GameSummary {
  id: Int!
  name: String!
  coverUrl: String
  releaseYear: Int
}

type BacklogEntry {
  id: ID!
  gameId: Int!
  gameName: String!
  coverUrl: String
  releaseYear: Int
  status: BacklogStatus!
  rating: Int
  createdAt: String!
  updatedAt: String!
}

type Stats {
  want_to_play: Int!
  playing: Int!
  completed: Int!
  abandoned: Int!
  avgRating: Float
}
```

### Input types

The mutation inputs should stay small and explicit.

```graphql
input CredentialsInput {
  email: String!
  password: String!
}

input AddBacklogInput {
  gameId: Int!
  name: String!
  coverUrl: String
  releaseYear: Int
  status: BacklogStatus!
}

input UpdateBacklogInput {
  status: BacklogStatus
  rating: Int
}
```

## Operations

### Queries

The first release of the schema should support:

```graphql
type Query {
  me: User
  searchGames(query: String!): [GameSummary!]!
  game(id: Int!): GameSummary
  backlog: [BacklogEntry!]!
  backlogStats: Stats!
}
```

### Mutations

The first release should support:

```graphql
type Mutation {
  register(input: CredentialsInput!): AuthPayload!
  login(input: CredentialsInput!): AuthPayload!
  addToBacklog(input: AddBacklogInput!): BacklogEntry!
  updateBacklog(id: ID!, input: UpdateBacklogInput!): BacklogEntry!
}
```

## Why These Operations

These operations cover the existing app’s real user flows:

- register or log in
- search for games
- add a game to the backlog
- update backlog status and rating
- view backlog entries
- view stats

That means the GraphQL layer will not be a decorative add-on. It will actually support the app the user sees today.

## Mapping From the Current REST API

The GraphQL contract should initially map to the current backend capabilities:

| GraphQL Operation | Current Data Source |
| --- | --- |
| `register` | `POST /auth/register` via the gateway |
| `login` | `POST /auth/login` via the gateway |
| `searchGames` | `GET /api/games/search` via the gateway |
| `game` | `GET /api/games/:id` via the gateway |
| `backlog` | `GET /api/backlog` via the gateway |
| `backlogStats` | `GET /api/backlog/stats` via the gateway |
| `addToBacklog` | `POST /api/backlog` via the gateway |
| `updateBacklog` | `PATCH /api/backlog/:id` via the gateway |

This gives us a low-risk migration path. The frontend can eventually move from REST calls to GraphQL without requiring the backend services to be redesigned first.

## Auth Model

The GraphQL API should keep the current bearer-token model.

Recommended approach:

- the client sends `Authorization: Bearer <token>`
- the gateway reads and validates the JWT
- authenticated resolvers get the user identity from the request context

This is a good fit because:

- it matches the current app
- it avoids inventing a second auth system
- it works cleanly for both queries and mutations

## Resolver Strategy

The gateway should behave as a composition layer, not as a place to duplicate business logic.

Resolver rules:

- validate input close to the edge
- forward the work to the owning service
- combine results only when the client actually needs a composed response
- avoid re-implementing domain rules in the GraphQL layer

## Field Naming Strategy

The GraphQL layer should be readable and ergonomic.

Recommended naming choices:

- `searchGames`
- `backlogStats`
- `addToBacklog`
- `updateBacklog`

That keeps the schema descriptive while staying close to the existing UI language.

## What Not To Add Yet

Phase 2 should stay focused. Do not add these yet:

- subscriptions
- file uploads
- federated GraphQL
- schema stitching across multiple GraphQL servers
- deeply nested service-specific types

The first version should be small, understandable, and easy to support.

## Done When

Phase 2 is complete when:

- the GraphQL operations are agreed on
- the core types are documented
- the auth approach is fixed
- we know how each GraphQL field maps to the existing services
- the contract is stable enough to implement in the next phase

## Why This Phase Matters

This phase gives us the API contract that everything else can build around.

Once the schema is defined, later phases can focus on implementation details for:

- GraphQL resolvers
- Go service concurrency
- Java service responsibilities
- RabbitMQ event flows

