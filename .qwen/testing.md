# Testing

## Core Philosophy
Tests are not proof that code works — they're a safety net that lets you change code confidently.
Test behavior, not implementation. If tests break when you refactor without changing behavior, the tests are wrong.

## What to Always Test
- Business logic — the rules that make your system valuable.
- Edge cases — empty inputs, nulls, zero, max values, concurrent operations.
- Failure paths — what happens when an external call fails, a file is missing, input is invalid.
- Any bug you've fixed — write a test that would have caught it, then fix it.

## What Not to Over-Test
- Don't test framework code or language built-ins — trust them.
- Don't write tests that just mirror the implementation — they add maintenance cost with no safety value.
- Don't test private internals — test the public interface.

## Test Structure
- Arrange, Act, Assert — setup, do the thing, check the result.
- One logical assertion per test where practical.
- Test names should describe behavior: `returns empty array when no results found` not `test query`.
- Tests should be independent — no test should depend on another running first.

## Test Types
- **Unit tests**: Fast, isolated, test a single function or module. The bulk of your tests.
- **Integration tests**: Test that components work together correctly — database, services, etc.
- **End-to-end tests**: Test the full flow from user perspective. Fewer, slower, high value.

## Mindset
- If code is hard to test, that's feedback — it usually means the design needs improvement.
- Write tests for the scenarios that would hurt most if they broke in production.
- Flaky tests are worse than no tests — fix or delete them.
