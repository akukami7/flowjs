# Routing in FlowJS

FlowJS uses a file-system based router built on the `app/` directory. Each folder defines a segment of the URL, and special files determine UI structure.

## File-based Routing
Routes are automatically generated based on folder structure. A `page.tsx` file makes a route segment publicly accessible.

```text
app/
├── page.tsx          # Maps to `/`
├── about/
│   └── page.tsx      # Maps to `/about`
```

## Nested Layouts
`layout.tsx` files wrap their local `page.tsx` and all deeply nested pages inside child directories. Layouts do not re-render upon nested navigation.

```text
app/
├── layout.tsx        # Wraps everything
├── page.tsx          # Wrapped by root layout
└── dashboard/
    ├── layout.tsx    # Wraps only the dashboard pages
    └── page.tsx      # Wrapped by both root and dashboard layouts
```

```tsx
// app/dashboard/layout.tsx
import { defineLayout } from "flowjs";

export default defineLayout({
    default({ children }) {
        return <section className="dashboard">{children}</section>;
    }
});
```

## Route Groups
Route groups allow you to organize folders without affecting the final URL path. Wrapping a folder name in parentheses creates a route group.

```text
app/
├── (marketing)/
│   ├── about/page.tsx   # Maps to `/about`
│   └── pricing/page.tsx # Maps to `/pricing`
```
This is useful for logically separating application domains or applying targeted `layout.tsx` wrappers.

## Dynamic Segments
Wrap folder names in square brackets `[name]` to create dynamic URL segments. 

```text
app/
└── blog/
    └── [slug]/
        └── page.tsx      # Maps to `/blog/hello-world`
```

The parsed value is available in `params`:
```tsx
import { definePage } from "flowjs";

export default definePage({
    default({ params }) {
        return <h1>Viewing Post: {params.slug}</h1>; // "hello-world"
    }
});
```

## Catch-all Segments
Wrap the bracket parameter with ellipsis `[...name]` to catch all subsequent URL paths.

```text
app/
└── docs/
    └── [...path]/
        └── page.tsx      # Maps to `/docs/a/b/c`
```
`params.path` will contain the array or joined string of the caught segments.

## Routing Priority Rules
When multiple routes could match a URL, FlowJS resolves using specific specificity rules:
1. **Exact static paths** taking topmost priority (`/about`).
2. **Dynamic segments** (`/[slug]`).
3. **Catch-all segments** (`/[...slug]`).
