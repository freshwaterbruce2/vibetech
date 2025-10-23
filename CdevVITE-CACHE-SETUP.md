# Vite Build Cache Setup

**Purpose:** Enable persistent Vite caching for 30-50% faster development server starts and builds

---

## Benefits

- **Dev Server:** 30-40% faster initial start
- **Builds:** 20-30% faster incremental builds
- **HMR:** Faster hot module replacement
- **Dependencies:** Pre-bundled and cached

---

## Implementation

### 1. Root vite.config.ts

Add to your main `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // CACHE CONFIGURATION
  cacheDir: '.vite-cache',

  optimizeDeps: {
    // Enable persistent caching
    force: false,

    // Pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'zod'
    ],

    // Exclude from pre-bundling (if needed)
    exclude: []
  },

  build: {
    // Enable incremental builds
    incremental: true,

    // Rollup cache
    rollupOptions: {
      cache: true,
      output: {
        manualChunks: {
          // Vendor chunk for better caching
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // UI library chunk
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            'lucide-react'
          ]
        }
      }
    }
  }
})
```

### 2. Update .gitignore

```gitignore
# Vite cache
.vite-cache/
**/node_modules/.vite/
```

### 3. Per-Project Configuration

For projects in `projects/active/web-apps/*/`:

Create or update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite-cache',
  optimizeDeps: {
    force: false,
    // Project-specific dependencies
    include: ['project-specific-deps']
  }
})
```

---

## Advanced Optimizations

### Manual Chunks Strategy

For large projects (e.g., business-booking-platform):

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        // Node modules → vendor
        if (id.includes('node_modules')) {
          // React core
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor'
          }
          // UI libraries
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-vendor'
          }
          // Utils
          if (id.includes('date-fns') || id.includes('zod')) {
            return 'utils-vendor'
          }
          // Everything else
          return 'vendor'
        }
      }
    }
  }
}
```

**Benefits:**
- Better caching (vendor chunks change less frequently)
- Parallel loading
- Faster updates (only changed chunks reload)

### TypeScript Incremental Compilation

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

Add to `.gitignore`:
```
*.tsbuildinfo
```

---

## Performance Measurement

### Before Cache

```bash
# Clear all caches
rm -rf .vite-cache node_modules/.vite .tsbuildinfo

# Measure dev start
time pnpm run dev

# Typical: 8-12 seconds
```

### After Cache (2nd run)

```bash
# With cache
time pnpm run dev

# Expected: 3-5 seconds (60% faster)
```

### Build Performance

```bash
# Clear cache
rm -rf .vite-cache

# First build
time pnpm run build
# Typical: 45-60 seconds

# Second build (with cache)
time pnpm run build
# Expected: 30-40 seconds (30% faster)
```

---

## Cache Management

### Viewing Cache Size

```bash
# Windows
powershell "(Get-ChildItem .vite-cache -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"

# Unix
du -sh .vite-cache
```

### Clearing Cache

```bash
# Manual cleanup
rm -rf .vite-cache node_modules/.vite

# Or via script
pnpm nx reset && rm -rf .vite-cache
```

### Automated Cleanup

Add to `package.json`:

```json
{
  "scripts": {
    "clean:cache": "rm -rf .vite-cache node_modules/.vite .nx/cache",
    "clean:deep": "npm run clean:cache && rm -rf node_modules"
  }
}
```

---

## Troubleshooting

### Cache not working?

1. **Check cacheDir exists:**
   ```bash
   ls -la .vite-cache
   ```

2. **Verify config:**
   ```bash
   cat vite.config.ts | grep cacheDir
   ```

3. **Force rebuild deps:**
   ```bash
   rm -rf node_modules/.vite
   pnpm run dev --force
   ```

### Stale cache issues?

Symptoms:
- Changes not reflecting
- Old code running
- Build errors

Solution:
```bash
# Clear and rebuild
rm -rf .vite-cache node_modules/.vite
pnpm run dev
```

### Large cache size?

If `.vite-cache` > 500MB:

```bash
# Clear and let it rebuild
rm -rf .vite-cache

# Or, configure cache size limit
# (Vite automatically manages size)
```

---

## Best Practices

1. **Commit .gitignore changes** (exclude cache dirs)
2. **Don't commit cache files** (always in .gitignore)
3. **Clear cache monthly** (remove stale entries)
4. **Monitor cache size** (should be < 500MB)
5. **Use manual chunks** for large apps

---

## Integration with Nx

Nx and Vite cache work together:

```
Build Flow:
1. Nx checks if build needed (source changes)
2. If yes, Nx runs vite build
3. Vite uses its cache for dependencies
4. Result cached by Nx for future runs

Result: Double caching = maximum speed
```

---

## Expected Results

### Development
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dev start (cold) | 10-12s | 6-8s | 40% faster |
| Dev start (warm) | 8-10s | 3-5s | 60% faster |
| HMR update | 200ms | 100ms | 50% faster |

### Production Build
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Full build | 60s | 40s | 33% faster |
| Incremental | 45s | 30s | 33% faster |
| Dep rebuild | 30s | 10s | 67% faster |

---

## Implementation Checklist

- [ ] Add cacheDir to vite.config.ts
- [ ] Configure optimizeDeps
- [ ] Update .gitignore
- [ ] Enable incremental builds
- [ ] Add manual chunks (optional)
- [ ] Enable TS incremental
- [ ] Test dev start time
- [ ] Test build time
- [ ] Verify cache working
- [ ] Document for team

**Estimated time:** 30 minutes  
**Expected impact:** 30-50% faster dev experience
