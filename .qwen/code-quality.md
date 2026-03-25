# Code Quality & Style

## Core Philosophy
Write code for the next person who reads it — that includes future you.
Clarity beats cleverness. If a solution needs a comment to be understood, consider simplifying it first.

## Naming
- Names should reveal intent. `getUserById` is better than `fetch` or `getU`.
- Booleans should read as questions: `isLoading`, `hasPermission`, `canRetry`.
- Avoid abbreviations unless universally understood (e.g. `id`, `url`, `ctx`).
- Functions should be verbs, data should be nouns.

## Functions
- A function should do one thing. If you're using "and" to describe it, split it.
- Keep functions short — if it doesn't fit on one screen, reconsider the design.
- Prefer pure functions (same input → same output, no side effects) wherever practical.
- Functions that can fail should make that explicit — return a result/error pair or throw with meaning.

## Comments
- Don't comment *what* the code does — comment *why* if it's non-obvious.
- A comment that just restates the code is noise.
- TODOs should include context: `// TODO: replace with streaming once API supports it`

## Structure
- Keep related things close together — spatial proximity signals logical connection.
- Separate concerns: data fetching, business logic, and presentation should not be tangled.
- Flat is better than deeply nested. If you're at 4+ levels of indentation, restructure.

## Consistency
- Be consistent within a file before worrying about being "correct."
- Pick a pattern and apply it uniformly — inconsistency is its own kind of bug.

## Dead Code
- Delete it. Don't comment it out. That's what git is for.
