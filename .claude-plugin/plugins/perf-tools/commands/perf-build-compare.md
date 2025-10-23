# Build Performance Comparison

Compare current build performance against a baseline to track regressions.

## Usage
```bash
/perf:build-compare [baseline]
```

## Task
Measure and compare build performance across the workspace:

1. **Run Baseline Build** (if not provided)
   ```bash
   # Clear cache for accurate measurement
   pnpm nx reset
   
   # Measure clean build time
   time pnpm nx run-many -t build --parallel=3 > build-baseline.log 2>&1
   ```

2. **Run Current Build**
   ```bash
   # Clear cache
   pnpm nx reset
   
   # Measure current build time
   time pnpm nx run-many -t build --parallel=3 > build-current.log 2>&1
   ```

3. **Extract Timing Data**
   Parse Nx output for per-project timing:
   ```
   business-booking-platform: 12.3s
   @vibetech/ui: 3.2s
   shipping-pwa: 8.7s
   iconforge: 7.1s
   ...
   ```

4. **Calculate Differences**
   ```
   BUILD PERFORMANCE COMPARISON
   ============================
   
   Baseline: 2025-10-01 (commit: 524f3c8f)
   Current:  2025-10-13 (commit: current)
   
   OVERALL PERFORMANCE
   ===================
   Total Build Time:
   Baseline: 3m 24s
   Current:  2m 47s
   Change:   -37s (18% faster ✓)
   
   PER-PROJECT BREAKDOWN
   =====================
   
   Improved (Faster):
   ✓ business-booking-platform: 12.3s → 9.8s (-2.5s, 20% faster)
   ✓ @vibetech/ui: 3.2s → 2.1s (-1.1s, 34% faster)
   ✓ shipping-pwa: 8.7s → 7.2s (-1.5s, 17% faster)
   
   Regressed (Slower):
   ⚠ iconforge: 7.1s → 9.4s (+2.3s, 32% slower)
     Likely Cause: Added fabric.js dependencies
     
   ⚠ nova-agent: 15.2s → 18.7s (+3.5s, 23% slower)
     Likely Cause: Increased bundle size
   
   No Significant Change:
   - memory-bank: 4.5s → 4.6s (+0.1s)
   - digital-content-builder: 6.2s → 6.0s (-0.2s)
   
   CACHE PERFORMANCE
   =================
   Baseline Cache Hit Rate: 72%
   Current Cache Hit Rate: 87%
   Improvement: +15% (excellent!)
   
   RECOMMENDATIONS
   ===============
   
   Address Regressions:
   1. iconforge (+2.3s)
      Action: Review fabric.js import strategy
      Consider: Dynamic imports for canvas features
      Expected Gain: ~1.5s
   
   2. nova-agent (+3.5s)
      Action: Analyze bundle size increase
      Run: pnpm run analyze in nova-agent project
      Expected Gain: ~2s
   
   Optimization Opportunities:
   3. Enable Nx Cloud for distributed caching
      Potential Impact: 50-70% faster CI builds
      
   4. Review TypeScript compilation settings
      incremental: true could save ~5-10s
   
   Next Steps:
   - Fix iconforge fabric.js imports (HIGH PRIORITY)
   - Analyze nova-agent bundle growth (MEDIUM)
   - Set up Nx Cloud (HIGH VALUE)
   - Benchmark after fixes to verify improvements
   ```

5. **Store Baseline**
   ```bash
   # Save current as new baseline
   echo "{ 
       \"date\": \"$(date -Iseconds)\",
       \"commit\": \"$(git rev-parse --short HEAD)\",
       \"total_time\": 167,
       \"projects\": {...}
   }" > .nx/build-baseline.json
   ```

## Benefits
- Track build performance over time
- Detect performance regressions early
- Identify slow projects
- Data-driven optimization priorities
- Historical performance trends
