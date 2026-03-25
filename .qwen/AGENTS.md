# 🤖 AGENTS.md — AI Agent Design System & Behavior Guide
> Full stack design system for consistent, production-grade UI/UX output.
> Stack: React + shadcn/ui + Tailwind CSS + TypeScript + Radix UI

---

## 📌 Table of Contents

1. [Agent Behavior Rules](#1-agent-behavior-rules)
2. [Tech Stack & Tooling](#2-tech-stack--tooling)
3. [Design Tokens](#3-design-tokens)
4. [Component Standards](#4-component-standards)
5. [Layout System](#5-layout-system)
6. [Typography](#6-typography)
7. [Color System](#7-color-system)
8. [Spacing & Sizing](#8-spacing--sizing)
9. [Animation & Motion](#9-animation--motion)
10. [Accessibility (a11y)](#10-accessibility-a11y)
11. [File & Folder Structure](#11-file--folder-structure)
12. [Code Quality Rules](#12-code-quality-rules)
13. [MCP Tool Usage](#13-mcp-tool-usage)
14. [Anti-Patterns (Never Do This)](#14-anti-patterns-never-do-this)
15. [Output Checklist](#15-output-checklist)
16. [Global Engineering Standards](#16-global-engineering-standards)

---

## 1. Agent Behavior Rules

These are non-negotiable rules the agent must follow on every single task.

### Always
- Read the full request before writing a single line of code
- Use shadcn/ui components first — never build from scratch what shadcn provides
- Apply `cn()` from `@/lib/utils` for all conditional className logic
- Write TypeScript — no plain `.js` or `.jsx` files
- Add proper ARIA attributes to every interactive element
- Keep components small and single-responsibility
- Use CSS variables from `globals.css` — never hardcode hex colors
- Decompose any component over 150 lines into sub-components
- Use `lucide-react` for all icons — no other icon libraries unless explicitly requested
- Validate all props with TypeScript interfaces or `type` definitions

### Never
- Never use inline `style={{}}` for anything achievable with Tailwind
- Never hardcode colors (e.g. `text-[#3b82f6]`) — use semantic tokens
- Never use `any` in TypeScript
- Never write bare `<div>` wrappers when a semantic HTML element exists
- Never mix Tailwind breakpoints inconsistently across a component
- Never add `console.log` to production components
- Never skip loading and error states
- Never create a component without considering its mobile layout first

---

## 2. Tech Stack & Tooling

### Core
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3.4+ | Utility-first styling |
| shadcn/ui | latest | Component library |
| Radix UI | latest | Headless primitives (via shadcn) |
| lucide-react | latest | Icons |
| next | 14+ | Framework (App Router) |

### MCP Servers (active in settings.json)
| MCP | Purpose |
|-----|---------|
| `shadcn-mcp` | Query shadcn component APIs, props, and usage |
| `playwright` | E2E testing, visual regression, UI verification |

### Utilities
```ts
// Always use cn() for className composition
import { cn } from "@/lib/utils"

// cn() merges Tailwind classes and handles conflicts properly
// Uses clsx + tailwind-merge under the hood
```

---

## 3. Design Tokens

All tokens live in `globals.css` as CSS custom properties. Never reference raw values directly in components.

### globals.css (base token structure)
```css
@layer base {
  :root {
    /* Background */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Card */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    /* Popover */
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* Brand */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    /* Secondary */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* Muted */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* Accent */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    /* Destructive */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    /* Border / Input / Ring */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    /* Radius */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... mirror all tokens for dark mode */
  }
}
```

### Using Tokens in Components
```tsx
// ✅ Correct — uses semantic token
<div className="bg-background text-foreground border border-border" />

// ❌ Wrong — hardcoded color
<div className="bg-white text-gray-900 border border-gray-200" />
```

---

## 4. Component Standards

### File Structure (per component)
```
components/
  ui/              ← shadcn auto-generated (don't touch)
  custom/
    MyComponent/
      index.tsx    ← main export
      types.ts     ← TypeScript interfaces
      hooks.ts     ← component-local hooks (if needed)
```

### Component Template
```tsx
import { cn } from "@/lib/utils"
import { type VariantProps, cva } from "class-variance-authority"

// 1. Define variants with cva for multi-variant components
const componentVariants = cva(
  // base classes
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

// 2. Define interface (extend HTML element props)
interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  label: string
  isLoading?: boolean
}

// 3. Component (use forwardRef for interactive elements)
const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, label, isLoading = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? <span className="animate-spin">...</span> : label}
      </div>
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent, componentVariants }
export type { MyComponentProps }
```

### shadcn Component Usage
Always import from `@/components/ui/` — never from `shadcn/ui` directly.

```tsx
// ✅ Correct
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
```

---

## 5. Layout System

### Responsive Breakpoints (Tailwind defaults)
| Breakpoint | Min-width | Usage |
|-----------|----------|-------|
| (base) | 0px | Mobile first — always start here |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### Mobile-First Rule
```tsx
// ✅ Always start from mobile, scale up
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8" />

// ❌ Never start from desktop and scale down
<div className="flex flex-row gap-8 md:flex-col md:gap-4" />
```

### Container Pattern
```tsx
// Standard page container
<main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
  {children}
</main>

// Narrow content (articles, forms)
<div className="mx-auto max-w-2xl">
  {children}
</div>
```

### Grid Patterns
```tsx
// Card grid
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Dashboard sidebar layout
<div className="flex min-h-screen">
  <aside className="w-64 shrink-0 border-r border-border bg-card hidden lg:block" />
  <main className="flex-1 overflow-auto p-6" />
</div>

// Split form layout
<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
```

---

## 6. Typography

### Scale (map to Tailwind)
| Role | Class | Size | Weight |
|------|-------|------|--------|
| Display | `text-4xl font-bold tracking-tight` | 36px | 700 |
| H1 | `text-3xl font-bold` | 30px | 700 |
| H2 | `text-2xl font-semibold` | 24px | 600 |
| H3 | `text-xl font-semibold` | 20px | 600 |
| H4 | `text-lg font-medium` | 18px | 500 |
| Body | `text-base` | 16px | 400 |
| Small | `text-sm` | 14px | 400 |
| XSmall | `text-xs` | 12px | 400 |
| Label | `text-sm font-medium` | 14px | 500 |
| Caption | `text-xs text-muted-foreground` | 12px | 400 |

### Typography Rules
- Page titles: `text-3xl font-bold tracking-tight`
- Section headers: `text-2xl font-semibold`
- Card titles: `text-lg font-semibold` or `text-xl font-semibold`
- Body copy: `text-base text-foreground leading-relaxed`
- Supporting text: `text-sm text-muted-foreground`
- Error messages: `text-sm text-destructive`
- Success messages: `text-sm text-green-600 dark:text-green-400`

```tsx
// Page header pattern
<div className="space-y-1">
  <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
  <p className="text-muted-foreground">Supporting description here.</p>
</div>
```

---

## 7. Color System

### Semantic Color Usage
| Token | Use For |
|-------|---------|
| `bg-background` | Page background |
| `bg-card` | Card/panel backgrounds |
| `bg-muted` | Subtle backgrounds, disabled states |
| `bg-primary` | Primary actions, CTAs |
| `bg-secondary` | Secondary actions |
| `bg-accent` | Hover states, highlights |
| `bg-destructive` | Delete, error, danger actions |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Supporting / secondary text |
| `text-primary` | Brand-colored text |
| `text-destructive` | Error text |
| `border-border` | Default borders |
| `border-input` | Form input borders |
| `ring-ring` | Focus rings |

### Status Colors
```tsx
// Success
<span className="text-green-600 dark:text-green-400">Success</span>
<div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" />

// Warning
<span className="text-yellow-600 dark:text-yellow-400">Warning</span>
<div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800" />

// Error
<span className="text-destructive">Error</span>
<div className="bg-destructive/10 border border-destructive/20" />

// Info
<span className="text-blue-600 dark:text-blue-400">Info</span>
<div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800" />
```

### Dark Mode
- Always add `dark:` variants alongside light mode classes
- Never use `bg-white` — use `bg-background`
- Never use `text-black` — use `text-foreground`
- Never use `text-gray-500` — use `text-muted-foreground`

---

## 8. Spacing & Sizing

### Spacing Scale (Tailwind)
| Token | Size | Use |
|-------|------|-----|
| `gap-1` / `p-1` | 4px | Tight inline spacing |
| `gap-2` / `p-2` | 8px | Icon + label gap, small padding |
| `gap-3` / `p-3` | 12px | List item padding |
| `gap-4` / `p-4` | 16px | Card padding (default) |
| `gap-6` / `p-6` | 24px | Section spacing, card padding (large) |
| `gap-8` / `p-8` | 32px | Between major sections |
| `gap-12` | 48px | Between page sections |
| `gap-16` | 64px | Between top-level blocks |

### Component Sizing Standards
```tsx
// Buttons (match shadcn defaults)
// sm: h-9, md: h-10, lg: h-11

// Inputs: always h-10
<Input className="h-10" />

// Icons: match context
// In buttons: size={16} or size={18}
// Standalone decorative: size={20} or size={24}
// Large feature icons: size={32} or size={48}

// Avatar sizes
// sm: h-8 w-8, md: h-10 w-10, lg: h-12 w-12

// Card padding: always p-6, inner sections gap-4 or gap-6
```

### `space-y` vs `gap`
```tsx
// Use gap for flex/grid children (preferred)
<div className="flex flex-col gap-4">

// Use space-y for stacked block-level elements when not using flex
<div className="space-y-4">

// Never mix both on the same element
```

---

## 9. Animation & Motion

### Principles
- Animations should be subtle, purposeful, and fast (150–300ms)
- Never animate things that don't need it — motion should communicate state
- All Radix-powered shadcn components have built-in animations — don't override them

### Standard Transitions
```tsx
// Interactive elements
className="transition-colors duration-150"         // color changes
className="transition-opacity duration-200"        // show/hide
className="transition-transform duration-200"      // movement
className="transition-all duration-150"            // use sparingly

// Scale on hover (subtle)
className="hover:scale-[1.02] transition-transform duration-150"

// Fade in (new content)
className="animate-in fade-in duration-200"

// Slide in (panels, drawers)
className="animate-in slide-in-from-bottom-4 duration-300"
```

### Loading States
```tsx
// Skeleton (use shadcn Skeleton)
import { Skeleton } from "@/components/ui/skeleton"
<Skeleton className="h-4 w-[200px]" />
<Skeleton className="h-10 w-full" />

// Spinner (lucide)
import { Loader2 } from "lucide-react"
<Loader2 className="h-4 w-4 animate-spin" />

// Button loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Saving..." : "Save"}
</Button>
```

---

## 10. Accessibility (a11y)

### Non-Negotiable Rules
- Every `<img>` must have `alt` text (empty string `alt=""` for decorative images)
- Every form input must have a `<Label>` connected via `htmlFor` / `id`
- Every interactive element must be keyboard navigable
- Focus rings must be visible — never `outline-none` without a replacement
- Color must never be the only indicator of state

### ARIA Patterns
```tsx
// Loading state
<div aria-busy={isLoading} aria-live="polite">

// Icon-only buttons (must have aria-label)
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Status badges
<span role="status" aria-label="3 notifications">
  <Badge>3</Badge>
</span>

// Expandable sections
<button aria-expanded={isOpen} aria-controls="section-content">
  Toggle
</button>
<div id="section-content" hidden={!isOpen}>
  Content
</div>

// Required fields
<Label htmlFor="email">
  Email <span aria-hidden="true" className="text-destructive">*</span>
</Label>
<Input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-describedby="email-error"
/>
{error && (
  <p id="email-error" role="alert" className="text-sm text-destructive">
    {error}
  </p>
)}
```

### Focus Management
```tsx
// ✅ Never remove focus ring
// ❌ className="focus:outline-none"  ← BAD

// ✅ Replace with visible ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

---

## 11. File & Folder Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Route group — auth pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/          # Route group — protected pages
│   │   ├── layout.tsx        # Dashboard shell
│   │   └── settings/page.tsx
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Design tokens + base styles
│
├── components/
│   ├── ui/                   # shadcn components (auto-generated, don't edit)
│   ├── layout/               # Shell, Sidebar, Navbar, Footer
│   ├── forms/                # Reusable form components
│   ├── data/                 # Tables, charts, data display
│   └── [feature]/            # Feature-specific components
│
├── hooks/                    # Custom React hooks
├── lib/
│   ├── utils.ts              # cn() and other utilities
│   └── validators.ts         # Zod schemas
│
├── types/                    # Global TypeScript types
├── constants/                # App-wide constants
└── config/                   # Site config, nav config, etc.
```

### Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useUserProfile.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `UserProfile`, `ApiResponse<T>` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| CSS classes | kebab-case (Tailwind) | `bg-background` |
| Route folders | kebab-case | `user-settings/` |

---

## 12. Code Quality Rules

### TypeScript
```ts
// ✅ Always type component props
interface CardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

// ✅ Use union types for constrained values
type ButtonVariant = "default" | "outline" | "ghost" | "destructive"

// ✅ Generic types for reusable patterns
interface ApiResponse<T> {
  data: T
  error: string | null
  status: number
}

// ❌ Never use any
const handler = (data: any) => {} // BAD
```

### Imports (always in this order)
```tsx
// 1. React
import React, { useState, useEffect, useCallback } from "react"

// 2. Next.js
import Link from "next/link"
import { useRouter } from "next/navigation"

// 3. Third-party libraries
import { z } from "zod"
import { useForm } from "react-hook-form"

// 4. shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// 5. Icons
import { Loader2, Plus, Trash2 } from "lucide-react"

// 6. Local components
import { UserCard } from "@/components/user/UserCard"

// 7. Hooks, utils, types
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/types"
```

### Forms (react-hook-form + zod)
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: FormValues) {
    // handle submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  )
}
```

---

## 13. MCP Tool Usage

### shadcn MCP
The shadcn MCP runs on `localhost:3176`. Use it to:
- Query available components and their props
- Get usage examples for complex components like `DataTable`, `Combobox`, `Command`
- Verify component API before writing code

**When to consult shadcn MCP:**
- Before implementing any complex UI pattern (command palette, date picker, data table)
- When unsure about the correct props/variants for a component
- When adding a new component to the project (use `npx shadcn@latest add <component>`)

### Playwright MCP
Use for UI verification after generating components:
- Screenshot components in different states
- Verify responsive layout behavior
- Test keyboard navigation flows
- Check focus ring visibility

---

## 14. Anti-Patterns (Never Do This)

### Styling
```tsx
// ❌ Inline styles
<div style={{ color: '#3b82f6', padding: '16px' }} />

// ❌ Hardcoded colors
<div className="bg-[#1e293b] text-[#f8fafc]" />

// ❌ Non-semantic color tokens
<div className="bg-blue-500 text-white" />  // use bg-primary instead

// ❌ Missing dark mode
<div className="bg-gray-100 text-gray-900" />  // always add dark: variants

// ❌ Mixing spacing approaches
<div className="space-y-4 gap-4" />
```

### Components
```tsx
// ❌ God components (>150 lines without decomposition)
// ❌ Missing loading states
// ❌ Missing error states
// ❌ Props without TypeScript types
// ❌ useEffect for derived state (use useMemo)
// ❌ Anonymous default exports (always named)
export default function() {} // BAD — always name it
export default function MyComponent() {} // GOOD
```

### Accessibility
```tsx
// ❌ onClick on non-interactive elements
<div onClick={handleClick}>Click me</div>  // use <button> instead

// ❌ Missing aria-label on icon buttons
<button><X /></button>  // add aria-label="Close"

// ❌ Missing alt on images
<img src="/hero.png" />  // always add alt=""

// ❌ Removing focus ring
className="focus:outline-none"  // never without a ring replacement
```

---

## 15. Output Checklist

Before delivering any component or page, verify:

### Code Quality
- [ ] TypeScript — no `any` types
- [ ] All props typed with interfaces
- [ ] Named exports (no anonymous defaults)
- [ ] Imports in correct order
- [ ] No `console.log` statements
- [ ] No hardcoded colors or values

### Design
- [ ] Uses shadcn/ui components where applicable
- [ ] Uses `cn()` for conditional classes
- [ ] Uses CSS variable tokens (not raw colors)
- [ ] Dark mode variants on all color classes
- [ ] Consistent spacing using scale (4, 8, 12, 16, 24, 32px)
- [ ] Mobile-first responsive design

### UX & States
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled
- [ ] Hover/focus states visible
- [ ] Disabled state styled correctly

### Accessibility
- [ ] All images have `alt`
- [ ] All inputs have connected `<Label>`
- [ ] Icon-only buttons have `aria-label`
- [ ] Focus rings visible on all interactive elements
- [ ] Keyboard navigable

### Structure
- [ ] Component under 150 lines (or broken into sub-components)
- [ ] File in correct folder per structure guide
- [ ] Named per conventions (PascalCase components, camelCase hooks)

---

## 16. Global Engineering Standards

> This section extends this design system with broader engineering standards that apply
> across all work — not just frontend. These rules are defined in separate files that
> live alongside this file in `~/.qwen/`. They apply to every task regardless of language,
> framework, or project type.

### Referenced Context Files

| File | Scope | What It Covers |
|------|-------|----------------|
| `ai-interaction.md` | 🌐 Global | How to communicate, explain decisions, format responses |
| `code-quality.md` | 🌐 Global | Naming, function design, comments, structure |
| `architecture.md` | 🌐 Global | System design, separation of concerns, designing for failure |
| `security.md` | 🌐 Global | Input validation, secrets, auth, common vulnerabilities |
| `backend.md` | 🌐 Global | API design, error handling, database access, performance |
| `testing.md` | 🌐 Global | What to test, test structure, mindset |
| `devops.md` | 🌐 Global | Git habits, env vars, logging, CI/CD |
| `personal-stack.md` | 🌐 Global | Language philosophy, preferences, defaults |

### Key Cross-Cutting Rules

These are the highest-priority rules from the global files — treat them as non-negotiable
even on frontend tasks:

**From `security.md`**
- Never hardcode secrets or API keys anywhere — including `.env.local` committed to git
- Validate all external input at the boundary — API responses, URL params, form data
- Never expose stack traces or internal paths in client-facing error messages

**From `architecture.md`**
- Business logic belongs in a dedicated layer — not in route handlers or UI components
- Design for failure: every API call, fetch, or async operation must handle the error case

**From `code-quality.md`**
- Names should reveal intent — no single-letter variables outside of tiny loop counters
- Delete dead code — don't comment it out

**From `ai-interaction.md`**
- Briefly explain the *why* behind non-obvious decisions — I learn from this
- Write production-quality code by default — not demo or scaffold code
- If a task is too vague to do well, ask one clarifying question before proceeding

---

*Last updated: auto-maintained by agent. Do not edit manually — update this file through the agent with a design system update request.*
