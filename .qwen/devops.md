# DevOps & Workflow

## Core Philosophy
Automate anything you do more than twice. Manual processes drift; automated processes don't.
Ship small and often — large changes are hard to review, hard to debug, and hard to roll back.

## Git Habits
- Commit messages should describe *why* the change was made, not just what: `fix race condition in auth token refresh` not `fix bug`.
- Commit often in small, logical units. Each commit should leave the codebase in a working state.
- Never commit directly to main/master on a shared project.
- Review your diff before committing — catch debug logs, commented code, and unintended changes.

## Environment Variables
- Every environment-specific value belongs in an env file or secrets manager, not in code.
- Maintain a `.env.example` file with all required keys documented (but no real values).
- Distinguish between `development`, `staging`, and `production` configs — they are not the same.
- Never commit `.env` files. Ever.

## Logging
- Log events that matter: errors, warnings, significant state changes, and slow operations.
- Include context in logs: what happened, where, with what inputs (scrubbed of secrets).
- Use log levels correctly: DEBUG for development noise, INFO for significant events, WARN for recoverable issues, ERROR for failures.
- Don't log in loops or hot paths — log aggregates.

## CI/CD Mindset
- If it's not automated, it will eventually be skipped.
- Tests, linting, and security checks should run before code merges.
- Deployments should be repeatable and reversible.

## Dependency Management
- Pin dependency versions in production — floating versions break builds unpredictably.
- Audit dependencies periodically. Delete unused ones.
- Before adding a dependency, ask: is this worth the maintenance cost?
