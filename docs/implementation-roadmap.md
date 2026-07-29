# Implementation Roadmap

This roadmap turns the target architecture into a sequence of small, understandable milestones.

The goal is to keep the project shippable at each step while moving toward the final resume-ready description:

> Designed and implemented a distributed microservices architecture featuring Go and Java services, GraphQL APIs, RabbitMQ messaging, PostgreSQL persistence, and Docker Compose orchestration to demonstrate scalable backend system design.

## Guiding Principles

- Keep the current app working while we evolve it.
- Add one meaningful concept at a time.
- Prefer clear service boundaries over cleverness.
- Make each milestone easy to explain in an interview.
- Do not start implementation until explicitly requested.

## Current Baseline

The repo already has:

- a frontend
- a Fastify gateway
- separate backend services
- PostgreSQL
- Docker Compose

That means we are not starting from zero. The roadmap is about expanding the stack into a more varied distributed system, not replacing everything at once.

The first set of architecture choices is captured in [`docs/phase-1-decisions.md`](./phase-1-decisions.md).

## Roadmap Overview

1. Lock the target architecture and service responsibilities
2. Introduce the GraphQL contract
3. Add RabbitMQ to the local environment
4. Add a Go service focused on concurrency
5. Add a Java service with a separate domain responsibility
6. Wire async events between services
7. Connect persistence paths to PostgreSQL
8. Update developer docs and resume-facing language
9. Add tests and polish

## Phase 1: Lock the Architecture

### Goal

Make sure every service has a clear reason to exist before coding starts.

### Decisions to settle

- Which service will expose GraphQL?
- Which domain responsibility belongs to Go?
- Which domain responsibility belongs to Java?
- Which service remains the owner of the primary PostgreSQL writes?
- Which events should travel through RabbitMQ?

### Done when

- Each service has a one-sentence purpose.
- The request/response flow is clear.
- The event flow is clear.
- We can explain the architecture in plain English.

### Why this comes first

This prevents us from building disconnected features that look good individually but do not form a coherent portfolio story.

## Phase 2: Introduce the GraphQL Contract

### Goal

Define the client-facing API shape before wiring extra services behind it.

### Scope

- one GraphQL endpoint
- a small set of queries and mutations
- data models that reflect the current app and the future service split

### Done when

- the frontend can fetch data through GraphQL
- the schema is stable enough to build against
- the API hides internal service boundaries

### Why this matters

GraphQL becomes the front door to the system. Once the contract is defined, we can attach services behind it without changing the UI shape repeatedly.

## Phase 3: Add RabbitMQ

### Goal

Create the async messaging backbone that makes the architecture feel distributed.

### Scope

- RabbitMQ service in Compose
- exchange and queue naming strategy
- at least one event type for service-to-service communication

### Done when

- the stack can start RabbitMQ locally
- one service can publish an event
- another service can consume it

### Why this matters

This is the point where the system stops being just “multiple HTTP services” and becomes event-driven in a meaningful way.

## Phase 4: Add the Go Service

### Goal

Build the service that best showcases goroutines, channels, scheduler behavior, and `context.Context`.

### Recommended shape

- a concurrency-heavy read workflow, or
- an event-processing workflow that fans out work in parallel

### Good interview story

- start multiple goroutines for parallel work
- collect results through channels
- propagate cancellation with `context.Context`
- merge results into a single response or follow-up action

### Done when

- the service has a real concurrent code path
- the code uses goroutines and channels for a legitimate reason
- the service can be described as a practical backend worker, not just a toy example

### Why this matters

This milestone is the main foundation for the resume language about Go.

## Phase 5: Add the Java Service

### Goal

Give the system a second backend runtime with a distinct purpose.

### Recommended shape

- reporting
- notifications
- audit processing
- profile enrichment

### Done when

- the Java service runs independently
- it owns its own responsibility
- it can consume or publish events as needed

### Why this matters

The Java service makes the architecture feel broader and more realistic. It also keeps the project from being “a Go demo plus a bunch of supporting code.”

## Phase 6: Wire Event-Driven Collaboration

### Goal

Make the services interact through RabbitMQ instead of only direct HTTP calls.

### Scope

- one service emits an event after a state change
- another service reacts to that event
- the behavior is observable locally

### Done when

- at least one end-to-end async workflow exists
- the system uses RabbitMQ for a real business action

### Why this matters

This is what makes “distributed microservices architecture” a fair description instead of just a label.

## Phase 7: Connect Persistence to PostgreSQL

### Goal

Ensure the important business state lands in PostgreSQL.

### Scope

- durable writes for the primary workflow
- any read models or materialized views needed by the services
- clear ownership of which service writes which table or schema

### Done when

- the data model is understandable
- each write has a clear owner
- persistence is not spread randomly across services

### Why this matters

This keeps the system grounded in real state rather than only transient API calls and queue messages.

## Phase 8: Update Documentation and Resume Language

### Goal

Make sure the repo tells the same story the code does.

### Scope

- README update
- architecture diagram update
- setup instructions for the full stack
- a concise explanation of the Go concurrency story

### Done when

- a new contributor can understand the system from the docs
- the resume language matches the implemented behavior
- the architecture overview and README agree

### Why this matters

Good documentation is part of the portfolio value. It also helps you study the system later.

## Phase 9: Tests and Polish

### Goal

Reduce risk and make the project presentable.

### Scope

- service-level tests for the most important logic
- integration tests for key flows where practical
- consistent error handling
- startup and shutdown hygiene

### Done when

- the core flow is covered by tests
- the system starts reliably in Docker Compose
- the architecture looks intentional and professional

### Why this matters

The final polish stage is what turns a technical experiment into something you can confidently show off.

## Recommended Build Order

If we take the work one piece at a time, the safest order is:

1. Architecture decisions
2. GraphQL contract
3. RabbitMQ setup
4. Go service
5. Java service
6. Async event wiring
7. PostgreSQL persistence details
8. Documentation
9. Tests and polish

That order minimizes rework because the contract and infrastructure are defined before the service internals are built.

## Risk Areas

### Risk: Too many moving parts at once

Mitigation:

- keep milestones small
- avoid building multiple services in the same step
- prefer one visible workflow per phase

### Risk: The architecture becomes too abstract

Mitigation:

- assign a concrete responsibility to each service
- keep user-facing flows simple
- make the end-to-end path easy to explain

### Risk: The Go service becomes a demo instead of a real service

Mitigation:

- choose a real I/O-heavy workflow
- use concurrency because the work benefits from it
- connect it to a meaningful business result

### Risk: The Java service feels bolted on

Mitigation:

- give it a clean domain responsibility
- let it own its own data or event processing logic
- make it useful even if the Go service is removed

## Working Agreement

When you are ready to start implementation, we can do it milestone by milestone.

That lets us:

- review the design before writing code
- keep each step understandable
- stop and adjust if a boundary needs refinement
