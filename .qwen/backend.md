# Backend & API Design

## Core Philosophy
An API is a contract. Once published, breaking it has a cost.
Design APIs for the consumer, not for the convenience of the implementation.

## API Design
- Use consistent, predictable naming — resources are nouns, actions are HTTP verbs.
- Return meaningful status codes: 200 success, 201 created, 400 bad client input, 401 unauthenticated, 403 unauthorized, 404 not found, 422 validation failure, 500 server error.
- Always return a consistent error shape: `{ error: { code, message, details? } }`.
- Version your APIs from day one — even if it's just `/v1/`.
- Pagination is not optional on any endpoint that can return unbounded results.

## Error Handling
- Handle errors at the right level — don't swallow errors deep in the stack, let them surface with context.
- Distinguish between expected errors (user did something wrong) and unexpected errors (system failure).
- Log unexpected errors with full context: what happened, inputs, stack trace.
- Never crash a process on a recoverable error.

## Database Access
- Never write raw queries where an ORM or query builder is available and appropriate.
- Keep database logic in a dedicated data access layer — not in business logic, not in controllers.
- Always handle the case where a query returns nothing — don't assume results exist.
- Use transactions for operations that must succeed or fail together.
- Add indexes on columns you filter or sort by — don't wait for performance problems.

## Performance Habits
- Avoid N+1 queries — batch or join instead of querying in loops.
- Cache expensive, frequently-read, rarely-changed data.
- Set timeouts on all external calls. A hanging request should never hang forever.
- Log slow operations. Define "slow" before you need to debug it.

## Reliability
- Make operations idempotent where possible — safe to retry without side effects.
- Queue work that doesn't need to happen in the request lifecycle.
- Build retry logic with exponential backoff for external service calls.
