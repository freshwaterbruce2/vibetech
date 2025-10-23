# Nx Affected Smart Analysis

Intelligent affected project detection with enhanced dependency analysis and actionable insights.

## Usage
```bash
/nx:affected-smart [target]
```

## Task
Analyze the Nx workspace to identify affected projects with smart insights:

1. **Run Nx Affected Detection**
   ```bash
   pnpm nx affected:graph --file=affected-graph.json
   pnpm nx print-affected --select=projects
   ```

2. **Analyze Dependencies**
   - Identify transitive dependencies
   - Detect circular dependencies
   - Calculate impact radius (how many projects depend on changes)

3. **Provide Actionable Recommendations**
   - Which tests should run (prioritized by impact)
   - Estimated build time based on cache status
   - Suggested parallel execution strategy
   - Projects that can be skipped safely

4. **Cache Analysis**
   - Check which projects have valid cache
   - Estimate time savings from cache hits
   - Identify cache invalidation causes

5. **Output Summary**
   ```
   AFFECTED PROJECTS ANALYSIS
   ==========================
   
   Directly Affected: 3 projects
   - business-booking-platform (HIGH IMPACT: 5 dependents)
   - @vibetech/ui (CRITICAL: 8 dependents)
   - memory-bank (LOW IMPACT: 0 dependents)
   
   Transitively Affected: 5 projects
   - shipping-pwa (depends on @vibetech/ui)
   - iconforge (depends on @vibetech/ui)
   - vibe-tech-lovable (depends on @vibetech/ui)
   - taskmaster (depends on @vibetech/ui)
   - nova-agent (depends on @vibetech/ui)
   
   RECOMMENDATIONS
   ===============
   Cache Status: 6/8 projects cached (75% hit rate)
   Estimated Build Time: ~45s (with cache) vs ~3m (without)
   
   Suggested Command:
   pnpm nx affected -t build,test --parallel=3
   
   Priority Order (by impact):
   1. @vibetech/ui (CRITICAL - blocks 8 projects)
   2. business-booking-platform (HIGH - production app)
   3. memory-bank (LOW - no dependents)
   ```

6. **Optional: Run Target**
   If target specified, execute with optimal settings:
   ```bash
   pnpm nx affected -t ${target} --parallel=3
   ```

## Benefits
- Visual dependency impact analysis
- Smart build order recommendations
- Cache optimization insights
- Time estimation for CI planning
