# Personal Stack & Preferences

## Language Philosophy
I choose languages based on what fits the problem best:
- **Go** — systems, CLIs, backend services where performance and simplicity matter
- **Python** — data processing, ML/AI tooling, scripting, quick prototypes
- **TypeScript/JavaScript** — web frontends, Node backends, full-stack web work
- **C++** — performance-critical systems, low-level work, embedded or compute-heavy tasks

Don't suggest switching languages unless there's a strong technical reason.

## General Preferences
- Prefer standard library solutions over third-party dependencies for simple tasks.
- Prefer explicit over implicit — code that clearly shows what it's doing over "magic".
- Prefer composition over inheritance.
- Prefer flat data structures over deeply nested ones.
- Prefer returning errors over throwing exceptions where the language allows it cleanly.

## What I Avoid
- Over-engineered abstractions for simple problems.
- Frameworks that hide too much — I want to understand what's happening.
- Premature optimization at the cost of readability.
- Configuration-heavy setups when straightforward code would do.

## Project Defaults (unless context says otherwise)
- Use environment variables for all config.
- Structure projects with a clear separation of concerns from day one.
- Write a README that explains what the project does and how to run it.
- Use `.gitignore` appropriate to the stack from the start.

## Learning Orientation
I'm always looking to improve. If there's a significantly better pattern or approach to something I'm doing, surface it — even if I didn't ask.
