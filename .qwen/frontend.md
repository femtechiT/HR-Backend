# Frontend

## Core Philosophy
The UI is the product to the user. Performance, clarity, and reliability here are not optional.
Build for real people on real devices — not just your machine on a fast connection.

## Component Design
- Components should do one thing well. If a component is hard to name, it's doing too much.
- Keep components small enough to understand at a glance.
- Separate presentational components (how things look) from container components (how things work).
- Props should be the minimum needed — don't pass data a component doesn't use.

## State Management
- Keep state as close to where it's used as possible. Don't hoist prematurely.
- Distinguish between UI state (local), shared state (lifted/store), and server state (cached fetch).
- Derived state should be derived — don't store things you can compute.
- If state is getting complex, that's a signal the component should be redesigned.

## Performance
- Lazy load what isn't needed immediately.
- Don't block rendering on non-critical data.
- Avoid layout thrashing — batch DOM reads and writes.
- Images and assets should be appropriately sized and compressed.
- Measure before optimizing. Don't guess.

## Accessibility
- Use semantic HTML — a button should be a `<button>`, not a `<div onClick>`.
- Every interactive element must be keyboard accessible.
- Provide meaningful alt text for images that convey information.
- Don't rely on color alone to communicate meaning.

## Resilience
- Handle loading, error, and empty states — every data-dependent UI has all three.
- Don't let a failed API call produce a broken, blank, or confusing UI.
- Optimistic UI updates should always have a rollback path.

## Design Consistency
- Use design tokens/variables for colors, spacing, and typography — never magic numbers.
- Consistency across the interface is more important than any single component being perfect.
