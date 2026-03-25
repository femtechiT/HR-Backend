# Architecture & Design

## Core Philosophy
Design for change. The system you build today will need to evolve — make that easy, not painful.
Solve the problem you have, not the one you imagine you might have.

## Separation of Concerns
- Keep layers distinct: data access, business logic, and interface/transport should never bleed into each other.
- Business logic belongs in a dedicated layer — not in route handlers, not in database queries, not in UI components.
- If you find yourself writing business logic in a controller or component, extract it.

## Interfaces & Contracts
- Define clear contracts between components — what goes in, what comes out, what errors are possible.
- Depend on abstractions, not concrete implementations where it matters.
- If a module is hard to test in isolation, its dependencies are too tight.

## Modularity
- Design modules so they can be understood without reading the rest of the system.
- High cohesion within a module, low coupling between modules.
- A module that does too many things should be split. A module that knows too much about other modules should be decoupled.

## Designing for Failure
- Assume every external call can fail — network, database, filesystem, APIs.
- Design fallback behavior before building the happy path.
- Fail fast and fail loudly in development. Fail gracefully and silently (with logging) in production.

## Simplicity
- The best architecture is the simplest one that solves the actual problem.
- Avoid premature abstraction — wait until you see the pattern repeat at least twice before abstracting.
- Complexity is a cost. Every abstraction layer you add must justify itself.

## Evolution
- Make the next change easier, not just the current one correct.
- Document architectural decisions and their rationale — future you will thank present you.
