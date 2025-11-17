---
applyTo: 'src/**/*.{ts,tsx}'
name: "React & TypeScript Guidelines"
description: "Coding standards for React components and TypeScript in the monorepo"
---

## TypeScript Configuration

This project uses **strict mode** with additional safety checks enabled.

### Compiler Flags
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUncheckedIndexedAccess": true,
  "strictNullChecks": true
}
```

### Type Safety Rules

1. **No `any` types** - Use `unknown` or proper types
2. **Explicit return types** for exported functions
3. **Strict null checks** - Handle `undefined` and `null`
4. **Index access** - Always check array bounds

```typescript
// ❌ BAD
function processData(data: any) {
  return data.items[0];
}

// ✅ GOOD
function processData(data: UserData): User | undefined {
  return data.items[0];
}
```

## React Patterns

### Component Structure

```typescript
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from './types';

interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'default', 
  size = 'md',
  children,
  onClick 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium',
        variant === 'outline' && 'border-2',
        size === 'sm' && 'px-2 py-1 text-sm'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Import Aliases

**ALWAYS** use `@/` alias for `src/` imports:

```typescript
// ✅ GOOD
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { validateEmail } from '@/lib/validation';

// ❌ BAD - Never use relative imports from src
import { Button } from '../../../components/ui/button';
```

### File Organization

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── toast.tsx
│   ├── layout/          # Layout components
│   │   ├── PageLayout.tsx
│   │   └── Navigation.tsx
│   └── [feature]/       # Feature-specific components
│       ├── BlogCard.tsx
│       └── ServiceGrid.tsx
├── hooks/               # Custom React hooks
│   ├── useAnalytics.ts
│   └── useAuth.ts
├── lib/                 # Utilities
│   ├── utils.ts
│   └── validation.ts
├── pages/               # Route components
│   ├── Home.tsx
│   └── About.tsx
└── types/               # Shared TypeScript types
    └── index.ts
```

## State Management

### Server State (React Query)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

function BlogPosts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const createPost = useMutation({
    mutationFn: createNewPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <PostList posts={data} />;
}
```

### Local State (useState/useReducer)

```typescript
// Simple state
const [isOpen, setIsOpen] = useState(false);

// Complex state
const [state, setState] = useState({
  name: '',
  email: '',
  message: ''
});

// Or use useReducer for complex state logic
const [state, dispatch] = useReducer(formReducer, initialState);
```

## Form Handling

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type FormData = z.infer<typeof formSchema>;

function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    await login(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
    </form>
  );
}
```

## Error Handling

### Error Boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
      }}
    >
      <Routes />
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

### Try-Catch for Async Operations

```typescript
async function handleSubmit(data: FormData) {
  try {
    await submitForm(data);
    toast.success('Form submitted successfully');
  } catch (error) {
    if (error instanceof ValidationError) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
      console.error('Submission error:', error);
    }
  }
}
```

## Performance Optimization

### Code Splitting (Lazy Loading)

```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ data, onUpdate }) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processLargeDataset(data);
  }, [data]);

  // Memoize callbacks to prevent child re-renders
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return <DataGrid data={processedData} onUpdate={handleUpdate} />;
}
```

## Styling with Tailwind CSS

### Custom Theme Integration

```typescript
// Use cn() utility to merge Tailwind classes
import { cn } from '@/lib/utils';

function Card({ className, children }) {
  return (
    <div className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}>
      {children}
    </div>
  );
}
```

### CSS Variables (Aura Theme)

```typescript
// Use custom CSS variables from tailwind.config.ts
<div className="bg-[var(--c-purple)] text-[var(--aura-textMuted)]">
  Custom themed content
</div>
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## Custom Hooks

### Best Practices

```typescript
// Use `use` prefix
// Return object for multiple values
// Document dependencies
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const searchQuery = useDebounce(inputValue, 300);
```

## Analytics Integration

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function ProductPage() {
  const { trackPageView, trackEvent } = useAnalytics();

  useEffect(() => {
    trackPageView('product-page');
  }, [trackPageView]);

  const handleAddToCart = (productId: string) => {
    trackEvent('add_to_cart', { product_id: productId });
  };

  return <Product onAddToCart={handleAddToCart} />;
}
```

## Accessibility

### Semantic HTML

```typescript
// ✅ GOOD
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// ❌ BAD
<div className="nav">
  <div onClick={goHome}>Home</div>
</div>
```

### ARIA Attributes

```typescript
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  onClick={handleClose}
>
  <XIcon />
</button>
```

### Keyboard Navigation

```typescript
function Dialog({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return <div role="dialog" aria-modal="true">...</div>;
}
```

## Common Patterns

### Conditional Rendering

```typescript
// Short-circuit for simple conditions
{isLoading && <Spinner />}

// Ternary for if-else
{error ? <ErrorMessage /> : <Content />}

// Early return for complex conditions
if (!user) {
  return <LoginPrompt />;
}
return <Dashboard user={user} />;
```

### List Rendering

```typescript
// Always use unique keys
{posts.map(post => (
  <PostCard key={post.id} {...post} />
))}

// Conditional list rendering
{posts.length > 0 ? (
  posts.map(post => <PostCard key={post.id} {...post} />)
) : (
  <EmptyState />
)}
```

## Code Style

### No Emojis
- No emojis in code comments or commit messages
- Keep code professional and clear

### Comments
```typescript
// ✅ GOOD - Explain WHY, not WHAT
// Use debounce to prevent excessive API calls during rapid typing
const debouncedSearch = useDebounce(searchTerm, 300);

// ❌ BAD - Obvious from code
// Set the debounced value
const debouncedSearch = useDebounce(searchTerm, 300);
```

### Function Length
- Keep functions/methods under 50 lines when possible
- Extract complex logic into separate functions
- Single Responsibility Principle

### Error Handling
```typescript
// Explicit error handling over silent failures
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Failed to complete operation');
  // Don't swallow errors silently
}
```

## Build & Development

### Build Commands
```bash
# Development
pnpm run dev

# Production build
pnpm run build:production

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
pnpm run lint:fix
```

### Pre-commit Checks
```bash
# Run before committing
pnpm run quality      # lint + typecheck + build
pnpm run quality:fix  # Auto-fix issues
```

## Key References

- React 19 documentation
- TypeScript 5.9 documentation
- Tailwind CSS 4 documentation
- React Query (TanStack Query) 5
- React Router v7
- shadcn/ui component library
