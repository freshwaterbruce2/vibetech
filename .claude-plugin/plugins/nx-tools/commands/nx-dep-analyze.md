# Nx Dependency Analyzer

Deep dependency analysis with circular dependency detection and optimization suggestions.

## Usage
```bash
/nx:dep-analyze [--circular] [--depth]
```

## Task
Comprehensive dependency analysis for the Nx workspace:

1. **Generate Dependency Graph**
   ```bash
   pnpm nx graph --file=graph.json
   pnpm nx list
   ```

2. **Analyze Dependency Patterns**
   - Map all project dependencies
   - Calculate dependency depth (layers)
   - Identify circular dependencies
   - Find highly coupled projects
   - Detect unused dependencies

3. **Circular Dependency Detection**
   ```bash
   # Check for circular deps
   pnpm nx graph --file=graph.json
   # Parse graph.json for cycles
   ```

4. **Output Comprehensive Report**
   ```
   NX DEPENDENCY ANALYSIS
   ======================
   
   Workspace Overview:
   - Total Projects: 11
   - Libraries: 1 (@vibetech/ui)
   - Applications: 10
   - Average Dependencies per Project: 2.3
   
   DEPENDENCY LAYERS
   =================
   
   Layer 0 (Foundation - no dependencies):
   - @vibetech/ui
   - crypto-enhanced
   - memory-bank
   
   Layer 1 (depends on Layer 0):
   - business-booking-platform (depends: @vibetech/ui)
   - shipping-pwa (depends: @vibetech/ui)
   - iconforge (depends: @vibetech/ui)
   - vibe-tech-lovable (depends: @vibetech/ui)
   - digital-content-builder (independent)
   
   Layer 2 (depends on Layer 1):
   - taskmaster (depends: @vibetech/ui, business-booking-platform types)
   - nova-agent (depends: @vibetech/ui, memory-bank)
   - deepcode-editor (depends: @vibetech/ui)
   
   CIRCULAR DEPENDENCIES
   =====================
   ✓ No circular dependencies detected
   
   HIGHLY COUPLED PROJECTS
   =======================
   
   1. @vibetech/ui (CRITICAL BOTTLENECK)
      Dependents: 8 projects
      Impact: Changes force rebuild of entire workspace
      Recommendation: Consider splitting into smaller packages
      
      Suggested Split:
      - @vibetech/ui-core (Button, Input, Card)
      - @vibetech/ui-forms (Form components, validation)
      - @vibetech/ui-data (Tables, Charts, DataDisplay)
      - @vibetech/ui-navigation (Nav, Menu, Breadcrumb)
   
   2. memory-bank (MODERATE COUPLING)
      Dependents: 2 projects (nova-agent, digital-content-builder)
      Impact: Moderate - only affects specific apps
      Status: Acceptable coupling level
   
   DEPENDENCY HEALTH METRICS
   =========================
   
   Average Depth: 1.2 layers (GOOD)
   Max Depth: 2 layers (GOOD)
   Circular Dependencies: 0 (EXCELLENT)
   Bottleneck Projects: 1 (@vibetech/ui)
   Isolated Projects: 3 (can build independently)
   
   OPTIMIZATION RECOMMENDATIONS
   ============================
   
   HIGH PRIORITY:
   1. Split @vibetech/ui to reduce coupling
      Impact: Reduces unnecessary rebuilds by ~60%
      Effort: 6-8 hours
      
   2. Consider extracting shared types to @vibetech/types
      Impact: Clearer dependency boundaries
      Effort: 2-3 hours
   
   MEDIUM PRIORITY:
   3. Review memory-bank API surface
      Consider: Separate API package from implementation
      Benefit: Better encapsulation
      
   LOW PRIORITY:
   4. Document dependency rationale
      Create DEPENDENCIES.md explaining why each dep exists
   
   VISUALIZATION
   =============
   
   Dependency Graph generated at: graph.json
   View with: pnpm nx graph
   
   Critical Path:
   @vibetech/ui → [8 projects] → tests → deployment
   
   Build Parallelization Opportunity:
   crypto-enhanced, memory-bank, digital-content-builder
   can build fully in parallel (no shared dependencies)
   ```

5. **Generate Actionable Tasks**
   Create specific TODO items for addressing bottlenecks:
   - Refactoring tasks for highly coupled projects
   - Documentation tasks for complex dependencies
   - Optimization opportunities

## Benefits
- Identify architectural bottlenecks
- Prevent circular dependencies
- Optimize build parallelization
- Guide refactoring priorities
- Improve workspace maintainability
