# AGENTS.md - Web Applications

This file extends the root AGENTS.md with specific instructions for web application projects in this directory. These applications must be **production-ready, not MVPs**.

## Web Application Standards

### Technology Stack Requirements
- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite for modern bundle optimization
- **UI Components**: shadcn/ui components exclusively
- **Styling**: Tailwind CSS with design system consistency
- **State Management**: React Query (TanStack Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Testing**: Playwright for E2E, React Testing Library for components

### Performance Standards (MANDATORY)
- **Lighthouse Score**: >90 for Performance, Accessibility, Best Practices, SEO
- **Core Web Vitals**:
  - First Contentful Paint (FCP): <1.5s
  - Largest Contentful Paint (LCP): <2.5s
  - Cumulative Layout Shift (CLS): <0.1
  - First Input Delay (FID): <100ms
- **Bundle Size**: <500KB main bundle, <100KB per route chunk
- **Time to Interactive**: <3s on 3G connection

### Quality Gates (Pre-Production)
- [ ] All TypeScript types properly defined (no `any`)
- [ ] 100% accessibility compliance (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness validated
- [ ] Performance budget maintained
- [ ] Security headers configured
- [ ] Error boundaries implemented
- [ ] Loading states and error handling comprehensive

## Development Patterns

### Component Architecture
```typescript
// Use this pattern for all components
interface ComponentProps {
  // Well-defined TypeScript interfaces
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Proper hooks usage
  // Error handling
  // Loading states
  // Accessibility attributes

  return (
    <div role="appropriate-role" aria-label="descriptive-label">
      {/* shadcn/ui components only */}
    </div>
  );
};
```

### State Management Pattern
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Server state with React Query
const useApiData = () => {
  return useQuery({
    queryKey: ['api-data'],
    queryFn: fetchApiData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Mutations with optimistic updates
const useUpdateData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApiData,
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries(['api-data']);
      const previousData = queryClient.getQueryData(['api-data']);
      queryClient.setQueryData(['api-data'], newData);
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['api-data'], context?.previousData);
    },
    onSettled: () => {
      // Refresh data
      queryClient.invalidateQueries(['api-data']);
    },
  });
};
```

### Form Handling Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  field1: z.string().min(1, 'Required field'),
  field2: z.email('Invalid email format'),
});

type FormData = z.infer<typeof formSchema>;

const FormComponent = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field1: '',
      field2: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      form.reset();
    } catch (error) {
      // Handle error appropriately
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* shadcn/ui form components */}
    </form>
  );
};
```

## Testing Requirements

### E2E Testing with Playwright
```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle user interaction flow', async ({ page }) => {
    // Test complete user flows, not just individual components
    await page.click('[data-testid="trigger-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();

    // Test error states
    // Test loading states
    // Test accessibility
  });

  test('should be accessible', async ({ page }) => {
    // Accessibility testing
    const accessibilityResults = await page.accessibility.snapshot();
    expect(accessibilityResults).toBeTruthy();
  });
});
```

### Component Testing Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Component from './Component';

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Component', () => {
  it('should render and handle interactions', async () => {
    render(<Component />, { wrapper: createTestWrapper() });

    // Test rendering
    expect(screen.getByRole('button')).toBeInTheDocument();

    // Test interactions
    fireEvent.click(screen.getByRole('button'));

    // Test async behavior
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

## Build & Deployment

### Vite Configuration Standards
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    sourcemap: true,
    target: 'esnext',
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

### Environment Configuration
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_APP_NAME: z.string(),
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']),
});

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
});
```

## Security Requirements

### Content Security Policy
```html
<!-- All apps must implement CSP -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               font-src 'self' data:;">
```

### Input Validation
```typescript
// Always validate all inputs
import { z } from 'zod';

const userInputSchema = z.object({
  email: z.string().email().max(255),
  message: z.string().min(1).max(1000),
});

const validateUserInput = (input: unknown) => {
  try {
    return userInputSchema.parse(input);
  } catch (error) {
    throw new ValidationError('Invalid input format');
  }
};
```

## Performance Optimization

### Code Splitting Strategy
```typescript
// Lazy load routes and components
import { lazy, Suspense } from 'react';

const LazyRoute = lazy(() => import('./routes/LazyRoute'));

const App = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/lazy" element={<LazyRoute />} />
      </Routes>
    </Suspense>
  </Router>
);
```

### Asset Optimization
```typescript
// Image optimization
import { lazy } from 'react';

const OptimizedImage = ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    {...props}
  />
);
```

## Project-Specific Instructions

Each web application should have its own AGENTS.md file extending these standards:
- `hotel-booking/AGENTS.md` - Booking system specific patterns
- `shipping-pwa/AGENTS.md` - PWA requirements and offline functionality
- `digital-content-builder/AGENTS.md` - Content management patterns
- `vibe-booking-platform/AGENTS.md` - Platform-specific requirements
- `vibe-tech-lovable/AGENTS.md` - Marketing site optimization

## Common Issues & Solutions

### Bundle Size Optimization
1. **Analysis**: Use `npm run analyze` to identify large dependencies
2. **Tree Shaking**: Ensure imports are properly structured
3. **Code Splitting**: Split routes and heavy components
4. **Lazy Loading**: Defer loading of non-critical components

### Performance Debugging
1. **Lighthouse CI**: Automated performance monitoring
2. **React DevTools Profiler**: Component rendering optimization
3. **Network Tab**: Resource loading optimization
4. **Memory Tab**: Memory leak detection

Remember: Every web application must be **production-ready with enterprise-grade performance and reliability**. No MVPs or prototypes in production.