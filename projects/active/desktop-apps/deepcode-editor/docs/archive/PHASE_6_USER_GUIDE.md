# Phase 6: Confidence-Based Planning - User Guide

## Overview

Phase 6 enhances Agent Mode with intelligent risk assessment and automatic fallback strategies. The agent now analyzes each step before execution, calculates success probability, and prepares backup plans for risky operations.

## What's New

### Confidence Scoring

Every step in a task plan now receives a confidence score (0-100) that indicates how likely it is to succeed:

- **70-100% (Low Risk)**: High confidence, no fallbacks needed ✓
- **40-69% (Medium Risk)**: Moderate confidence, fallbacks generated ⚠
- **0-39% (High Risk)**: Low confidence, multiple fallbacks required ⚠

### Confidence Factors

The agent considers multiple factors when scoring confidence:

1. **Memory-Backed Patterns** (+40 points)
   - Has this worked before in similar situations?
   - What was the success rate?

2. **File Existence** (+20 points)
   - For file operations: Does the file likely exist?
   - Common patterns: package.json, tsconfig.json, etc.

3. **Action Complexity** (-15 points)
   - Code generation is inherently uncertain
   - Simple read/write operations are more reliable

### Fallback Plans

Medium and high-risk steps automatically get 1-3 fallback strategies:

**Fallback 1: Search First** (75% confidence)
- If reading a file fails, search the workspace for it
- Handles file location changes

**Fallback 2: Create Default** (60% confidence)
- If file not found, create with sensible defaults
- Useful for config files (creates empty `{}`)

**Fallback 3: Ask User** (90% confidence)
- Last resort: request human assistance
- Guaranteed to get unblocked

### Planning Insights

Before execution, you get overall task metrics:

- **Overall Confidence**: Average confidence across all steps
- **Success Rate Estimate**: Predicted probability of task completion
- **Memory-Backed Steps**: How many steps have past success data
- **Fallbacks Generated**: Total backup plans created
- **High Risk Steps**: Count of steps needing special attention

## UI Components

### Confidence Badge

Each step displays its confidence score with color coding:

```
✓ 85% confidence • Memory-backed     (Green - Low Risk)
⚠ 55% confidence                     (Yellow - Medium Risk)
⚠ 35% confidence                     (Red - High Risk)
```

### Confidence Factors Panel

Expandable section showing what influenced the score:

```
Confidence Factors
  + Memory Match: Found similar past success (95% success rate)    +38
  + File Likely Exists: File path follows common patterns          +20
  - Complex Action: Code generation has inherent uncertainty       -15
```

### Fallback Indicator

Shows alternative approaches if primary fails:

```
3 Fallback Plans Available
  1 If file not found
    Search workspace for tsconfig*.json files
    75% confidence

  2 If file not found after search
    Create default tsconfig.json
    60% confidence

  3 If all attempts fail
    Request user assistance
    90% confidence
```

### Planning Insights Panel (Sidebar)

Summary metrics before you start:

```
Planning Insights
  Confidence:       67%
  Success Rate:     78%
  Memory-Backed:    1 / 3 steps
  Fallbacks:        3 plans
  High Risk:        0 steps
```

## Example Workflow

### Task: "Set up TypeScript project"

**Step 1: Agent Plans with Confidence**
```
Planning task with confidence analysis...

Step 1: Read tsconfig.json
  Confidence: 45% (medium risk) ⚠
  Factors:
    - No memory match: -10 pts
    - File may not exist: -10 pts
  Fallbacks Generated:
    1. Search for tsconfig*.json files (75% confidence)
    2. Create default tsconfig.json (80% confidence)

Step 2: Read package.json
  Confidence: 85% (low risk) ✓
  Factors:
    + Memory match: Found similar (95% success): +38 pts
    + File likely exists: +20 pts
  Memory-backed: Yes
  No fallbacks needed

Step 3: Install dependencies
  Confidence: 70% (low risk) ✓
  Factors:
    + Common action: +20 pts
  Fallbacks:
    1. Retry with npm instead of pnpm (70% confidence)

Planning Insights:
  Overall Confidence: 66.7%
  Estimated Success Rate: 78%
  High Risk Steps: 0
  Memory-Backed: 1 / 3
  Fallbacks Generated: 3
```

**Step 2: User Reviews & Approves**
- See confidence scores for each step
- Review fallback plans
- Make informed decision to proceed

**Step 3: Execution with Fallbacks**
```
Step 1: Read tsconfig.json
  [Primary] read_file('./tsconfig.json') → File not found
  [Fallback 1] search_codebase('tsconfig*.json') → Found at src/tsconfig.json
  Result: Success using fallback!

Step 2: Read package.json
  [Primary] read_file('./package.json') → Success (memory-backed, high confidence!)
  Result: Success on first try

Step 3: Install dependencies
  [Primary] run_command('pnpm install') → Success
  Result: Success on first try

Task completed successfully: 3/3 steps (used 1 fallback)
```

**Step 4: Learning for Next Time**
```
Memory updated with new patterns:
  - "Read tsconfig → Search first, then read" (confidence: 95%)
  - "Install dependencies with pnpm" (confidence: 85%)

Next time this task runs:
  - Step 1 will have higher confidence (memory-backed)
  - Fewer fallbacks needed
  - Faster execution
```

## Benefits

### 1. Transparency
- See exactly how confident the agent is before executing
- Understand what could go wrong
- Know what backup plans exist

### 2. Reliability
- Automatic fallbacks mean fewer failures
- Agent can recover without human intervention
- Tasks complete even when files move or are missing

### 3. Learning
- Successful patterns get stored in memory
- Confidence improves over time
- Common tasks become faster and more reliable

### 4. Safety
- High-risk steps are clearly marked
- Multiple safety nets for risky operations
- User assistance available as last resort

## Technical Details

### How Confidence is Calculated

```typescript
// Baseline
let score = 50;

// Memory boost (if similar task succeeded before)
if (memoryMatch && memoryMatch.successRate > 70) {
  score += (memoryMatch.successRate / 100) * 40;  // Up to +40 points
}

// File existence (for file operations)
if (fileOperation && filePathCommon) {
  score += 20;  // Common files like package.json
}

// Complexity penalty
if (actionType === 'generate_code') {
  score -= 15;  // Code generation is harder to predict
}

// Classify risk
if (score >= 70) riskLevel = 'low';
else if (score >= 40) riskLevel = 'medium';
else riskLevel = 'high';
```

### How Fallbacks are Generated

```typescript
// Only for medium/high risk
if (confidence.riskLevel === 'low') {
  return []; // No fallbacks needed
}

// Fallback 1: Search (for file operations)
if (action === 'read_file') {
  fallbacks.push({
    trigger: 'If file not found',
    action: { type: 'search_codebase', params: { searchQuery: filename } },
    confidence: 75
  });
}

// Fallback 2: Create default (for config files)
if (isConfigFile) {
  fallbacks.push({
    trigger: 'If file not found after search',
    action: { type: 'write_file', params: { content: '{}' } },
    confidence: 60
  });
}

// Fallback 3: User assistance (last resort for high risk)
if (confidence.riskLevel === 'high') {
  fallbacks.push({
    trigger: 'If all attempts fail',
    action: { type: 'request_user_input' },
    confidence: 90
  });
}
```

## Best Practices

### For Users

1. **Review Planning Insights First**
   - Check overall confidence before executing
   - Pay attention to high-risk step count
   - Low success rate? Maybe break task into smaller pieces

2. **Trust Memory-Backed Steps**
   - Green badges with "Memory-backed" are very reliable
   - These have worked before in similar situations
   - Less likely to need fallbacks

3. **Understand Fallbacks**
   - Read what the agent will try if primary fails
   - Some fallbacks create files - be aware of side effects
   - User assistance fallback means you'll be asked for help

4. **Learn from Patterns**
   - Similar tasks get easier over time
   - Agent learns your project structure
   - Common operations become more confident

### For Developers

1. **Use `planTaskEnhanced()` in UI**
   - Convenience wrapper with automatic memory
   - Returns insights for display
   - No StrategyMemory management needed

2. **Check Insights Before Execution**
   ```typescript
   const plan = await taskPlanner.planTaskEnhanced(request);

   if (plan.insights.highRiskSteps > 2) {
     console.warn('Task has multiple high-risk steps');
     // Maybe show extra warnings to user
   }
   ```

3. **Display Confidence Data**
   - Show badges for user transparency
   - Expandable factors for curious users
   - Insights panel for overall picture

4. **Handle Fallback Results**
   ```typescript
   if (result.data.usedFallback) {
     console.log(`Step succeeded using fallback ${result.data.fallbackId}`);
     // Maybe show different success message
   }
   ```

## Future Enhancements

Potential Phase 6+ improvements:

- **Custom Confidence Factors**: Project-specific rules
- **Fallback Customization**: User-defined backup strategies
- **Confidence Trends**: Track how confidence changes over time
- **Smart Retries**: Use fallbacks that worked before
- **Risk Profiles**: Different risk tolerance settings

---

**Generated with Claude Code**
**Phase 6 Complete - October 20, 2025**
