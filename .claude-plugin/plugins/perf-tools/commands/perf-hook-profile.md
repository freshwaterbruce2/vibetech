# Hook Performance Profiler

Profile Claude Code hook execution times to identify performance bottlenecks.

## Usage
```bash
/perf:hook-profile [days]
```

## Task
Analyze hook performance and identify slow hooks:

1. **Check Hook Performance Logs**
   ```bash
   # Check if performance tracking is enabled
   if [ -f "$TEMP/claude_hook_perf.jsonl" ]; then
       cat "$TEMP/claude_hook_perf.jsonl"
   else
       echo "Performance tracking not enabled"
       echo "Enable by wrapping hooks with performance-tracker.ps1"
   fi
   ```

2. **Parse Performance Data**
   ```powershell
   # Read last N days of hook executions
   $days = 7
   $cutoff = (Get-Date).AddDays(-$days)
   
   Get-Content "$env:TEMP\claude_hook_perf.jsonl" | 
       ConvertFrom-Json | 
       Where-Object { [datetime]$_.timestamp -gt $cutoff }
   ```

3. **Calculate Statistics**
   ```powershell
   $stats = $perfData | Group-Object hook | ForEach-Object {
       $durations = $_.Group.duration_ms
       [PSCustomObject]@{
           Hook = $_.Name
           Executions = $_.Count
           AvgMs = [math]::Round(($durations | Measure-Object -Average).Average, 2)
           MinMs = [math]::Round(($durations | Measure-Object -Minimum).Minimum, 2)
           MaxMs = [math]::Round(($durations | Measure-Object -Maximum).Maximum, 2)
           P95Ms = [math]::Round((($durations | Sort-Object)[[math]::Floor($durations.Count * 0.95)]), 2)
           TotalTimeS = [math]::Round(($durations | Measure-Object -Sum).Sum / 1000, 2)
       }
   }
   ```

4. **Generate Performance Report**
   ```
   HOOK PERFORMANCE PROFILE
   ========================
   
   Analysis Period: Last 7 days
   Total Hook Executions: 1,247
   Total Time Spent in Hooks: 4m 32s
   
   PER-HOOK STATISTICS
   ===================
   
   🔴 SLOW HOOKS (Avg > 200ms):
   
   1. user-prompt-submit.ps1
      Executions: 486
      Average: 247ms
      P95: 412ms (95% complete under this time)
      Max: 1,234ms (outlier)
      Total Time: 2m 0s
      
      Breakdown:
      - Agent orchestrator call: ~180ms (73%)
      - Task history update: ~35ms (14%)
      - Context saving: ~25ms (10%)
      - Prompt analysis: ~7ms (3%)
      
      Recommendations:
      * Make agent orchestrator async (run in background)
      * Cache agent recommendations for similar prompts
      * Skip orchestrator for simple questions
      * Target: <100ms average
   
   2. session-start.ps1
      Executions: 52
      Average: 387ms
      P95: 654ms
      Max: 1,876ms
      Total Time: 20s
      
      Breakdown:
      - Memory system queries: ~240ms (62%)
      - Git context gathering: ~85ms (22%)
      - Agent lookup: ~42ms (11%)
      - Display rendering: ~20ms (5%)
      
      Recommendations:
      * Move to async pattern (background job)
      * Cache last context for instant display
      * Lazy-load non-critical data
      * Target: <100ms for perceived startup
   
   🟡 MODERATE HOOKS (Avg 50-200ms):
   
   3. pre-tool-use-stdin.ps1
      Executions: 342
      Average: 87ms
      Impact: Low (acceptable for pre-flight checks)
   
   ✅ FAST HOOKS (Avg < 50ms):
   
   4. status-line.ps1
      Executions: 52
      Average: 23ms
      Status: ✓ Excellent performance
   
   5. post-tool-use-stdin.ps1
      Executions: 367
      Average: 12ms
      Status: ✓ Optimal
   
   PERFORMANCE TRENDS
   ==================
   
   Week-over-Week:
   user-prompt-submit: 247ms → 247ms (no change)
   session-start: 423ms → 387ms (-8% improvement)
   
   Top Bottlenecks:
   1. Agent orchestrator calls (2m 0s total)
   2. Memory system queries (18s total)
   3. Git operations (15s total)
   
   OPTIMIZATION RECOMMENDATIONS
   ============================
   
   IMMEDIATE (High Impact):
   1. Implement async session-start pattern
      Current: 387ms blocking
      Target: <100ms (cached display + background load)
      Impact: 4x faster perceived startup
      Effort: 1 hour
   
   2. Add smart triggering to user-prompt-submit
      Current: Runs on every prompt (100% of time)
      Target: Skip for 80% of simple prompts
      Impact: Save ~2m per week
      Effort: 30 minutes
   
   3. Cache agent recommendations
      Current: Call orchestrator every time
      Target: Cache for 5 minutes
      Impact: ~50% reduction in orchestrator calls
      Effort: 45 minutes
   
   SHORT-TERM:
   4. Optimize git operations
      Use: git status --short for faster output
      Impact: ~30% faster git calls
      Effort: 20 minutes
   
   5. Implement hook timeout guards
      Max execution: 500ms (kill if exceeded)
      Impact: Prevent runaway hooks
      Effort: 30 minutes
   
   HOOK HEALTH METRICS
   ===================
   
   Execution Success Rate: 99.7% (excellent)
   Failed Executions: 4 (0.3%)
   - 3x timeout (session-start.ps1)
   - 1x file not found (temporary issue)
   
   Average Session Overhead:
   Per Session: ~620ms total hook time
   Per Prompt: ~247ms average
   
   Target Overhead:
   Per Session: <200ms (67% reduction needed)
   Per Prompt: <50ms (80% reduction needed)
   ```

5. **Generate Optimization Plan**
   Create specific tasks for addressing bottlenecks:
   ```
   HOOK OPTIMIZATION PLAN
   ======================
   
   Phase 1 (Week 1):
   [ ] Implement async session-start
   [ ] Add conditional execution to user-prompt-submit
   [ ] Set up performance monitoring dashboard
   
   Phase 2 (Week 2):
   [ ] Add agent recommendation caching
   [ ] Optimize git operations
   [ ] Implement timeout guards
   
   Expected Results:
   - Session startup: 387ms → <100ms (74% faster)
   - Prompt overhead: 247ms → <50ms (80% faster)
   - User experience: Significantly improved
   ```

## Benefits
- Identify slow hooks
- Data-driven optimization
- Track performance improvements
- Prevent performance regressions
- Better developer experience
