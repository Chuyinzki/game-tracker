# Target Architecture Overview

This document describes the architecture we want to evolve this project toward, along with the core Go concepts you said you want to be able to explain confidently.

The current repo is already a multi-service backend application. The goal is to extend it into a more visibly distributed system that can honestly support the resume statement:

> Designed and implemented a distributed microservices architecture featuring Go and Java services, GraphQL APIs, RabbitMQ messaging, PostgreSQL persistence, and Docker Compose orchestration to demonstrate scalable backend system design.

## Big Picture

The system is easiest to think about as four layers:

1. Frontend
2. API composition layer
3. Domain services
4. Infrastructure

### Intended flow

```text
React Frontend
      |
      v
GraphQL API layer
      |
      +-------------------+
      |                   |
      v                   v
Go service            Java service
      |                   |
      +--------+----------+
               |
               v
          RabbitMQ events
               |
               v
         PostgreSQL data
```

The important part is that the services have different jobs:

- The GraphQL layer handles client-facing query composition.
- The Go service demonstrates concurrency, background work, and I/O fan-out.
- The Java service demonstrates a second backend implementation and can own a separate domain concern.
- RabbitMQ carries asynchronous events between services.
- PostgreSQL stores durable application state.
- Docker Compose runs the whole stack locally.

## What Each Piece Does

### Frontend

The frontend stays responsible for user interaction and presentation.

It should:

- send GraphQL queries and mutations
- render the returned data
- avoid knowing which backend service owns which data

This is one reason GraphQL is useful here: the frontend asks for the shape it needs instead of making multiple service-specific calls.

### GraphQL API layer

The GraphQL layer acts as a backend-for-frontend.

It should:

- expose a single endpoint
- gather data from multiple services
- hide service boundaries from the frontend
- translate client queries into internal service calls

In practice, this layer can be implemented in whichever language best fits the repo direction, but for your learning goals the key point is that GraphQL is the composition boundary, not the place where business logic lives.

### Go service

The Go service is the best place to showcase concurrency.

It should own a workflow that benefits from parallel I/O, such as:

- fetching from multiple internal sources
- processing event payloads concurrently
- coordinating background jobs
- aggregating results before returning them to the GraphQL layer

This service is where you can talk naturally about goroutines, channels, and cancellation.

### Java service

The Java service gives the system a second backend implementation and makes the architecture feel more like a real distributed system.

It could own a separate domain area such as:

- notifications
- reporting
- user profile enrichment
- audit/event processing

The exact domain is less important than the separation of concerns. The point is to show that the system contains more than one backend runtime and that those runtimes communicate over service boundaries instead of sharing code directly.

### RabbitMQ

RabbitMQ is the async communication layer.

It should be used for things that do not need to block the user request:

- an item was created
- a status changed
- a background enrichment task should run
- a report should be updated

This helps demonstrate a distributed architecture because services do not need to call each other synchronously for every action.

### PostgreSQL

PostgreSQL remains the source of truth for durable data.

It should store:

- user records
- game/backlog records
- event processing state
- any materialized data needed for reads or reporting

If RabbitMQ carries the event and a service needs to persist the result, PostgreSQL is where that durable state lives.

### Docker Compose

Docker Compose is the local orchestration layer.

It should bring up:

- frontend
- GraphQL layer
- Go service
- Java service
- RabbitMQ
- PostgreSQL

That makes the project easy to run locally and gives you a concrete story for how the distributed system is wired together.

## Data Flow

### 1. User reads data

1. The frontend sends a GraphQL query.
2. The GraphQL layer resolves the query.
3. It may call the Go service, the Java service, or both.
4. The response is assembled into one client-friendly payload.

This is the main reason GraphQL is attractive here: the client gets a single shaped response instead of performing multiple round trips.

### 2. User performs a change

1. The frontend sends a GraphQL mutation.
2. The GraphQL layer validates and forwards the command.
3. One service persists the authoritative change in PostgreSQL.
4. That service publishes an event to RabbitMQ.
5. Other interested services consume the event and react.

This is the event-driven part of the architecture.

### 3. Background work runs

1. A service consumes a queue message.
2. It does the work asynchronously.
3. It stores any resulting data in PostgreSQL or emits a follow-up event.

This pattern keeps request latency low and moves slow work off the user-facing path.

## Why Go Fits This Story

Go is especially good for systems work where you want:

- simple concurrency primitives
- low-overhead parallelism
- fast startup
- strong standard library support
- easy deployment with a single binary

That makes it a good fit for a service that spends a lot of time waiting on network calls, queue messages, or database operations.

## Interview-Ready Go Concepts

### Why goroutines instead of threads?

Goroutines are lighter than OS threads.

The useful short answer is:

- Threads are managed by the operating system and are comparatively expensive.
- Goroutines are managed by the Go runtime and are cheaper to create and schedule.
- Because they are lighter, you can run a large number of concurrent tasks without the same memory and scheduling cost you would get from a thread-per-task model.

That does not mean goroutines replace threads entirely. It means Go gives you a more ergonomic and efficient concurrency model for many server workloads.

### What are channels?

Channels are typed conduits for communication between goroutines.

You can think of them as a safe way to pass values from one concurrent task to another.

They help with two things:

- communication: moving data between goroutines
- synchronization: letting one goroutine wait for another to produce or consume something

Channels are especially useful when you want to coordinate work without manually locking shared state.

### How does the scheduler work?

The Go runtime schedules goroutines onto a smaller set of OS threads.

A good mental model is:

- goroutines are the tasks
- OS threads are the execution workers underneath
- the scheduler multiplexes many goroutines onto those workers

This is why Go can handle high concurrency efficiently. A goroutine can block on I/O or wait on a channel while the runtime keeps other goroutines moving.

### What is `context.Context` used for?

`context.Context` is for request-scoped control and cancellation.

It is commonly used for:

- cancellation propagation
- deadlines and timeouts
- request metadata
- passing values that should live only for the lifetime of a request

In a service architecture, this matters because one slow dependency should not hold the whole request forever. If the client disconnects or the timeout expires, `context.Context` helps every downstream call stop work cleanly.

## A Practical Go Example Story

If the Go service is aggregating data from multiple places, it can do something like this:

1. Start one goroutine per downstream call.
2. Send each result back over a channel.
3. Wait for all results or fail fast if the context is canceled.
4. Merge the data into one response.

That story naturally demonstrates:

- goroutines for parallel work
- channels for communication
- the scheduler enabling concurrency
- context cancellation when work should stop

## Why Java Still Makes Sense

Java is useful here because it shows that the project is not tied to one language for all backend work.

It also gives you a chance to talk about tradeoffs such as:

- a different runtime and ecosystem
- a different concurrency model
- service ownership by domain rather than by language

From a resume perspective, the presence of both Go and Java makes the architecture more believable as a distributed backend system.

## Recommended Service Boundaries

A clean split would be:

- GraphQL layer: client-facing API composition
- Go service: concurrent aggregation or processing
- Java service: asynchronous domain processing or reporting
- PostgreSQL: persistent storage
- RabbitMQ: event transport

This keeps the design understandable and gives each runtime a reason to exist.

## What Makes the Quote Credible

The resume statement feels credible if the implementation includes:

- at least one Go service with real goroutine and channel usage
- at least one Java service with its own codebase and responsibility
- GraphQL as the primary client API
- RabbitMQ-based asynchronous messaging
- PostgreSQL-backed persistence
- Docker Compose wiring the services together

Without those pieces, the statement would sound broader than the codebase. With them, it becomes a fair summary of the system.

## Suggested Next Build Order

1. Add RabbitMQ and PostgreSQL to Compose if they are not already fully wired for the target architecture.
2. Introduce the GraphQL layer and define the client contract.
3. Build the Go service around a single concurrency-heavy workflow.
4. Build the Java service around one separate domain concern.
5. Connect the services with events.
6. Update the README so the repo clearly explains the new architecture.

## Mental Model Summary

If you want the shortest possible explanation of the whole design:

- GraphQL is the front door.
- Go handles concurrent backend work.
- Java owns a separate backend concern.
- RabbitMQ moves events between services.
- PostgreSQL stores durable state.
- Docker Compose makes it all runnable locally.

And for Go specifically:

- goroutines are lightweight concurrent tasks
- channels move data between goroutines
- the scheduler runs many goroutines on fewer OS threads
- `context.Context` lets you cancel or time out work cleanly

