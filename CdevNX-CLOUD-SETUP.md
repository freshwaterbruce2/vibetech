# Nx Cloud Setup Guide

**Purpose:** Enable distributed caching for 60-70% faster CI builds and cross-machine cache sharing

---

## Benefits

- **Local Development:** Share cache between machines (laptop + desktop)
- **CI/CD:** 60-70% faster builds (5-8min → 2-3min)
- **Team:** Cache hits from teammates' builds
- **Analytics:** Build performance insights

---

## Setup Steps

### 1. Connect to Nx Cloud (5 minutes)

```bash
pnpm nx connect
```

This will:
- Create an Nx Cloud workspace
- Generate access token
- Update nx.json automatically

### 2. Verify Connection

```bash
# Check nx.json for nxCloudAccessToken
cat nx.json | grep -A 2 "nxCloudAccessToken"

# Should see something like:
# "nxCloudAccessToken": "YOUR_TOKEN_HERE"
```

### 3. First Cloud Build

```bash
# Clear local cache to test cloud
pnpm nx reset

# Run a build
pnpm nx run-many -t build

# Should see: "remote cache hit" messages
```

---

## Configuration Options

### Basic Configuration (Already Done)

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "typecheck"],
        "parallel": 3
      }
    }
  }
}
```

### Advanced: Parallel Optimization

Based on your system (8 logical cores, 16GB RAM):

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "typecheck"],
        "parallel": 4,
        "maxParallel": 6
      }
    }
  }
}
```

**Rationale:**
- parallel: 4 (for 4 physical cores)
- maxParallel: 6 (allows burst parallelism)

---

## GitHub Actions Integration

### Update `.github/workflows/ci.yml`

Add after setup steps:

```yaml
- name: Setup Nx Cloud
  run: |
    echo "NX_CLOUD_ACCESS_TOKEN=${{ secrets.NX_CLOUD_ACCESS_TOKEN }}" >> $GITHUB_ENV

- name: Cache Nx
  uses: actions/cache@v4
  with:
    path: .nx/cache
    key: ${{ runner.os }}-nx-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Add Secret to GitHub

1. Go to: Settings → Secrets → Actions
2. Add: `NX_CLOUD_ACCESS_TOKEN`
3. Value: Copy from nx.json

---

## Expected Performance

### Before Nx Cloud
| Scenario | Duration | Cache Source |
|----------|----------|--------------|
| CI Build (cold) | 15-20 min | None |
| CI Build (warm) | 5-8 min | Local cache |
| Local Build (cold) | 8-12 min | None |
| Local Build (warm) | 2-3 min | Local cache |

### After Nx Cloud
| Scenario | Duration | Cache Source |
|----------|----------|--------------|
| CI Build (cold) | 2-4 min | Cloud cache |
| CI Build (warm) | 2-3 min | Cloud cache |
| Local Build (cold) | 1-2 min | Cloud cache |
| Local Build (warm) | <1 min | Local + Cloud |

**Expected Improvement:**
- CI: 60-70% faster
- Local: 50-70% faster on cold builds
- Cache hit rate: 85-95% (vs 60-70% local only)

---

## Monitoring & Analytics

### Nx Cloud Dashboard

Access at: https://cloud.nx.app

**Key Metrics:**
- Cache hit rate (target: 85%+)
- Build time trends
- Slowest tasks
- Task distribution

### Command Line Analytics

```bash
# View recent runs
pnpm nx report

# Analyze workspace
pnpm nx graph
```

---

## Troubleshooting

### Cache not working?

```bash
# Check connection
pnpm nx reset

# Verify token
cat nx.json | grep nxCloudAccessToken

# Test with verbose output
NX_VERBOSE_LOGGING=true pnpm nx run-many -t build
```

### Low cache hit rate?

Possible causes:
1. **namedInputs too broad:** Refine inputs to exclude non-essential files
2. **Frequent dependency changes:** Normal, will improve over time
3. **CI agent differences:** Ensure consistent Node/pnpm versions

### Performance not improved?

Check:
1. Network speed (cloud cache download)
2. Parallel settings (may need tuning)
3. Task dependencies (blocking parallelism)

---

## Cost Considerations

**Free Tier:**
- Unlimited cache storage
- 500 hours/month CI time
- Perfect for solo developers

**Paid Tiers:**
- More CI hours
- Advanced analytics
- Priority support

**Recommendation:** Start with free tier, upgrade if needed

---

## Best Practices

1. **Commit nx.json changes** (with access token)
2. **Use .env for sensitive tokens** (optional, for CI)
3. **Monitor cache hit rates** weekly
4. **Clear cache monthly** to remove stale entries
5. **Review task dependencies** to maximize parallelism

---

## Rollback Plan

If Nx Cloud causes issues:

```bash
# Remove from nx.json
# Delete line: "nxCloudAccessToken": "..."

# Or, keep local caching only
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "cacheDirectory": ".nx/cache"
      }
    }
  }
}
```

---

## Next Steps

1. **Run setup:** `pnpm nx connect`
2. **Test locally:** Clear cache and rebuild
3. **Monitor:** Check Nx Cloud dashboard
4. **Optimize:** Tune parallel settings if needed
5. **Integrate CI:** Add to GitHub Actions

**Expected completion time:** 30 minutes
**Expected impact:** 60-70% faster builds
