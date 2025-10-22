# Nx Parallel Execution Optimizer

Analyze project dependencies and suggest optimal parallel execution configuration.

## Usage
```bash
/nx:parallel-optimize [target]
```

## Task
Analyze the workspace structure and recommend optimal parallel execution settings:

1. **Analyze Project Graph**
   ```bash
   pnpm nx graph --file=graph.json
   ```

2. **Calculate Optimal Parallelism**
   - Count total projects
   - Identify dependency chains (longest path)
   - Detect independent project groups
   - Analyze system resources (CPU cores)
   - Consider I/O constraints

3. **Dependency Chain Analysis**
   ```
   DEPENDENCY CHAINS
   =================
   
   Longest Chain (5 levels):
   @vibetech/ui → business-booking-platform → build artifacts → tests → deployment
   
   Independent Groups (can run fully parallel):
   Group 1: crypto-enhanced (Python - no deps)
   Group 2: memory-bank, digital-content-builder
   Group 3: shipping-pwa, vibe-tech-lovable, iconforge
   Group 4: taskmaster, nova-agent, deepcode-editor
   
   Bottleneck: @vibetech/ui (blocks 8 projects)
   ```

4. **System Resources Analysis**
   ```bash
   # CPU cores
   nproc 2>/dev/null || powershell "(Get-CimInstance -ClassName Win32_Processor).NumberOfLogicalProcessors"
   
   # Available memory
   free -h 2>/dev/null || powershell "[math]::Round((Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2)"
   ```

5. **Generate Recommendations**
   ```
   PARALLEL EXECUTION OPTIMIZATION
   ===============================
   
   System Resources:
   - CPU Cores: 8 logical (4 physical)
   - Available RAM: 12 GB
   - Disk: SSD (high I/O throughput)
   
   Current Configuration:
   - parallel: 3 (in nx.json)
   - maxParallel: not set (defaults to 3)
   
   RECOMMENDED CONFIGURATION
   =========================
   
   Optimal Parallel Setting: 4
   Reasoning:
   - 4 physical cores available
   - Independent project groups can utilize parallelism
   - Leaves 1-2 cores for system/IDE
   - Nx overhead per task: ~200MB RAM (safe for 12GB)
   
   For Local Development:
   {
     "tasksRunnerOptions": {
       "default": {
         "options": {
           "parallel": 4,
           "maxParallel": 6
         }
       }
     }
   }
   
   For CI Environment (GitHub Actions):
   - parallel: 3 (2-core runners)
   - Use Nx Cloud for distributed execution
   
   EXECUTION STRATEGIES
   ====================
   
   Fast Feedback (Development):
   pnpm nx affected -t lint,typecheck --parallel=4
   
   Full Build (Pre-commit):
   pnpm nx affected -t build,test --parallel=3
   (Lower parallelism for memory-intensive builds)
   
   Complete Quality Check:
   pnpm nx run-many -t quality --parallel=2
   (Sequential for accurate resource usage)
   
   ESTIMATED TIME SAVINGS
   ======================
   Current (parallel=3): ~45s for affected builds
   Optimized (parallel=4): ~34s for affected builds
   Improvement: 24% faster (11s saved)
   
   With Nx Cloud: ~8s (80% cache hit rate assumed)
   ```

6. **Optional: Update Configuration**
   Ask user if they want to apply recommended settings to nx.json

## Benefits
- Optimized build times based on actual system resources
- Prevents resource exhaustion
- Tailored recommendations for dev vs CI
- Measurable time savings
