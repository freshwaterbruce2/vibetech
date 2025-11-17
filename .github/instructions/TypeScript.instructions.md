---
applyTo: '**/*.{ts,tsx}'
---

## TypeScript & React Guidelines

### Import Aliases
Always use the `@/` alias for imports from the `src/` directory:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";

// ❌ Incorrect
import { Button } from "../../components/ui/button";
```

### Component Patterns

#### File Organization
- **UI Components**: `src/components/ui/` - shadcn/ui primitives
- **Feature Components**: `src/components/[feature]/` - domain-specific
- **Layout Components**: `src/components/layout/`
- **Pages**: `src/pages/` - React Router v6 route components

#### Component Structure
```typescript
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  // ... other props
}

export const Component: FC<ComponentProps> = ({ className, ...props }) => {
  return (
    <div className={cn("base-classes", className)}>
      {/* component content */}
    </div>
  );
};
```

### State Management
- Use **React Query** (TanStack Query) for server state
- Use React hooks (`useState`, `useReducer`) for local state
- Avoid prop drilling; use context when appropriate

### Forms
Use **React Hook Form** with **Zod** validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### Styling
- Use **Tailwind CSS** with the custom Aura theme
- Use `cn()` utility from `@/lib/utils` to merge classes
- CSS variables: `--c-purple`, `--c-cyan`, `--aura-accent`, `--aura-textMuted`

### Error Handling
- Wrap route components in ErrorBoundary
- Use try-catch for async operations
- Provide meaningful error messages

### Code Splitting
- Use `React.lazy()` for route-level code splitting
- Wrap lazy components in `<Suspense>` with fallback

### TypeScript Best Practices
- Enable strict mode in `tsconfig.json`
- Avoid `any` type; use `unknown` instead
- Define interfaces for component props
- Use type inference when possible
