# Bundle Size Analysis

Analyze bundle sizes across projects and identify optimization opportunities.

## Usage
```bash
/perf:bundle-analyze [project]
```

## Task
Comprehensive bundle size analysis with optimization recommendations:

1. **Build All Projects** (or specific project)
   ```bash
   pnpm nx run-many -t build --parallel=3
   # or
   pnpm nx build ${project}
   ```

2. **Analyze Bundle Sizes**
   ```bash
   # For each project with dist/ folder
   find projects -name "dist" -type d | while read distdir; do
       project=$(dirname "$distdir" | xargs basename)
       size=$(du -sh "$distdir" | cut -f1)
       echo "$project: $size"
   done
   ```

3. **Detailed File Analysis**
   For each project, list largest files:
   ```bash
   find dist -name "*.js" -o -name "*.css" | while read file; do
       size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
       echo "$size $file"
   done | sort -rn | head -20
   ```

4. **Generate Bundle Report**
   ```
   BUNDLE SIZE ANALYSIS
   ====================
   
   Generated: 2025-10-13 22:30
   Projects Analyzed: 10
   Total Bundle Size: 47.8 MB
   
   OVERALL STATISTICS
   ==================
   Average Bundle Size: 4.8 MB
   Largest Project: nova-agent (12.4 MB)
   Smallest Project: memory-bank (1.2 MB)
   
   PER-PROJECT BREAKDOWN
   =====================
   
   🔴 LARGE (>8 MB):
   1. nova-agent: 12.4 MB
      - vendor.js: 8.2 MB (THREE.js, electron libraries)
      - app.js: 3.1 MB (main application code)
      - app.css: 1.1 MB (Tailwind + custom styles)
      Recommendations:
      * Split THREE.js into separate chunk (dynamic import)
      * Enable Tailwind purge (could save ~800KB)
      * Consider code splitting for rarely-used features
      Potential Savings: ~4 MB (32% reduction)
   
   2. business-booking-platform: 9.8 MB
      - vendor.js: 5.4 MB (React, React Query, UI libraries)
      - app.js: 3.2 MB
      - assets: 1.2 MB (images, fonts)
      Recommendations:
      * Image optimization (WebP conversion)
      * Font subsetting (remove unused glyphs)
      * Review large UI component libraries
      Potential Savings: ~2 MB (20% reduction)
   
   🟡 MEDIUM (4-8 MB):
   3. shipping-pwa: 7.2 MB
      Status: Acceptable for PWA (offline-first requires larger bundle)
      
   4. vibe-code-studio: 6.8 MB
      Status: Desktop app - size less critical
   
   ✅ OPTIMAL (<4 MB):
   5. @vibetech/ui: 2.1 MB (component library)
   6. iconforge: 3.8 MB
   7. memory-bank: 1.2 MB (backend-focused)
   
   DEPENDENCY ANALYSIS
   ===================
   
   Top 10 Largest Dependencies (across all projects):
   1. three.js: 2.1 MB (used in 2 projects)
   2. react: 142 KB (used in 9 projects)
   3. react-dom: 133 KB (used in 9 projects)
   4. @tanstack/react-query: 89 KB (used in 7 projects)
   5. fabric.js: 1.8 MB (used in 1 project - iconforge)
   6. framer-motion: 156 KB (used in 5 projects)
   7. recharts: 423 KB (used in 3 projects)
   8. lucide-react: 89 KB (used in 8 projects - tree-shakeable ✓)
   9. zod: 54 KB (used in 6 projects)
   10. electron: 3.2 MB (used in 2 projects)
   
   Shared Dependency Opportunities:
   - three.js used by 2 projects → consider shared chunk
   - All UI libraries could benefit from shared vendor chunk
   
   OPTIMIZATION RECOMMENDATIONS
   =============================
   
   IMMEDIATE (High Impact, Low Effort):
   1. Enable Tailwind CSS purge in production builds
      Projects: nova-agent, vibe-code-studio
      Potential Savings: ~1.6 MB total
      Effort: 10 minutes
   
   2. Optimize images to WebP format
      Projects: business-booking-platform, shipping-pwa
      Potential Savings: ~800 KB total
      Effort: 30 minutes
   
   3. Font subsetting
      Projects: All projects using custom fonts
      Potential Savings: ~400 KB total
      Effort: 20 minutes
   
   SHORT-TERM (High Impact, Medium Effort):
   4. Implement code splitting for THREE.js
      Projects: nova-agent, vibe-tech-lovable
      Potential Savings: ~4 MB (load on-demand)
      Effort: 2 hours
   
   5. Lazy load heavy components
      Projects: business-booking-platform (payment forms)
      Potential Savings: ~1.2 MB initial load
      Effort: 3 hours
   
   LONG-TERM (Strategic):
   6. Consider Vite's manual chunks for shared dependencies
      Benefit: Better caching, faster updates
      Effort: 4 hours
   
   7. Evaluate alternative lighter-weight libraries
      Example: Replace recharts with lightweight charts
      Potential Savings: ~300 KB per project
      Effort: Varies by project
   
   BUNDLE SIZE BUDGET
   ==================
   
   Recommended Limits (per project type):
   - Libraries (@vibetech/ui): 2-3 MB ✓
   - Web Apps: 6-8 MB (⚠ 2 projects exceeding)
   - Desktop Apps: 10-12 MB (⚠ nova-agent at limit)
   - Mobile/PWA: 5-7 MB ✓
   
   Current Status:
   - Within Budget: 7 projects
   - Exceeding Budget: 2 projects (nova-agent, business-booking-platform)
   - Near Limit: 1 project (vibe-code-studio)
   ```

5. **Generate Historical Comparison**
   If previous report exists:
   ```
   CHANGE SINCE LAST ANALYSIS (7 days ago)
   ========================================
   
   Overall: 47.8 MB → 45.2 MB (-2.6 MB, 5% reduction)
   
   Improvements:
   ✓ iconforge: 5.2 MB → 3.8 MB (-1.4 MB) - Removed unused deps
   ✓ memory-bank: 1.5 MB → 1.2 MB (-0.3 MB) - Code cleanup
   
   Regressions:
   ⚠ nova-agent: 11.2 MB → 12.4 MB (+1.2 MB) - Added features
   
   Trend: Overall improving ✓
   ```

## Benefits
- Identify bloated bundles
- Track bundle size over time
- Prioritize optimization efforts
- Prevent bundle size creep
- Improve load times and performance
