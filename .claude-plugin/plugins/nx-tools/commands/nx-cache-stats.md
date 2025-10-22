# Nx Cache Statistics

Real-time Nx cache performance metrics and optimization recommendations.

## Usage
```bash
/nx:cache-stats
```

## Task
Analyze Nx cache performance and provide detailed statistics:

1. **Cache Directory Analysis**
   ```bash
   # Check cache size
   du -sh .nx/cache 2>/dev/null || powershell "(Get-ChildItem .nx/cache -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"
   
   # Count cached artifacts
   find .nx/cache -type f | wc -l 2>/dev/null || powershell "(Get-ChildItem .nx/cache -Recurse -File).Count"
   ```

2. **Recent Cache Performance**
   Parse `.nx/workspace-data` or recent Nx logs to extract:
   - Cache hit rate (last 10 builds)
   - Average time saved per cache hit
   - Most frequently cached targets
   - Projects with poor cache performance

3. **Cache Health Check**
   - Verify cache directory structure
   - Check for corrupted cache entries
   - Identify stale cache (> 7 days old)
   - Calculate cache efficiency ratio

4. **Output Detailed Report**
   ```
   NX CACHE STATISTICS
   ===================
   
   Cache Location: .nx/cache
   Cache Size: 847 MB
   Cached Artifacts: 1,234 files
   Cache Age: Last cleaned 3 days ago
   
   PERFORMANCE METRICS (Last 10 Builds)
   =====================================
   Cache Hit Rate: 87% (excellent)
   Cache Misses: 13%
   Average Time Saved: 2.3s per hit
   Total Time Saved: 4m 32s
   
   TOP CACHED TARGETS
   ==================
   1. build - 456 hits (92% hit rate)
   2. test - 234 hits (78% hit rate)
   3. lint - 189 hits (95% hit rate)
   4. typecheck - 167 hits (89% hit rate)
   
   PROJECTS WITH LOW CACHE PERFORMANCE
   ===================================
   1. business-booking-platform - 45% hit rate
      Cause: Frequent changes to shared dependencies
      
   2. crypto-enhanced - 0% hit rate
      Cause: Python project (not using Nx cache)
      
   RECOMMENDATIONS
   ===============
   ✓ Cache performing well overall (87% hit rate)
   ⚠ Consider more granular inputs for business-booking-platform
   ℹ Enable Nx Cloud for distributed caching (potential 95%+ hit rate)
   
   CACHE MAINTENANCE
   =================
   Last cleanup: 3 days ago
   Stale entries: 45 files (72 MB)
   
   Suggested Actions:
   - Run 'pnpm nx reset' to clear stale cache
   - Enable remote caching with Nx Cloud
   - Review namedInputs configuration for low-performing projects
   ```

5. **Optional Actions**
   Ask user if they want to:
   - Clear stale cache entries
   - Reset entire cache
   - Enable Nx Cloud setup

## Benefits
- Understand cache effectiveness
- Identify optimization opportunities
- Track time savings from caching
- Monitor cache health
