# Weekly Planning Template

## Sprint Period: [Start Date] - [End Date]

**Planning Session Date:** [When you're doing this planning]
**Sprint Duration:** Flexible (typically 5-7 work days)

---

## Weekly Outcome Goals (Not Task Lists)

### Primary Outcomes This Week

**What specific, measurable results do you want to achieve?**

1. **[Outcome 1]**
   - **Success Metric:** [How you'll measure success]
   - **Business Impact:** [Why this matters]
   - **Estimated Effort:** [Hours or complexity]

2. **[Outcome 2]**
   - **Success Metric:** [How you'll measure success]
   - **Business Impact:** [Why this matters]
   - **Estimated Effort:** [Hours or complexity]

3. **[Outcome 3]**
   - **Success Metric:** [How you'll measure success]
   - **Business Impact:** [Why this matters]
   - **Estimated Effort:** [Hours or complexity]

**Examples of Good Outcomes:**
- "Deploy authentication feature with <2% error rate"
- "Reduce build time from 8min to 4min through pipeline optimization"
- "Increase test coverage from 65% to 80% in core modules"

---

## Capacity Planning & Reality Check

### Available Capacity This Week
```
Total Work Hours Available: ___ hours
- Deep Work Blocks: ___ hours (target: 15-20 hours)
- Shallow Work: ___ hours
- Meetings & Collaboration: ___ hours
- Buffer for Unknowns: ___ hours (always reserve 15-20%)
```

### Committed Hours vs Available
```
Total Estimated Hours for Outcomes: ___ hours
Available Capacity: ___ hours
Utilization: ___%

Status:
[ ] Green (< 80% utilization) - Healthy
[ ] Yellow (80-90% utilization) - At capacity
[ ] Red (> 90% utilization) - Overcommitted, need to adjust
```

**If Red:** What can you defer, delegate, or delete?

---

## Flexible Daily Planning (Not Rigid Schedule)

Instead of fixed Monday-Friday tasks, plan by work type and energy:

### High-Leverage Work (Deep Focus Required)
These are your priority outcomes that need uninterrupted focus:

**When to Schedule:** During your peak energy hours
**Time Blocks Needed:** ___ blocks of 2-3 hours each

- [ ] [Deep work task 1]
- [ ] [Deep work task 2]
- [ ] [Deep work task 3]

### Medium-Leverage Work (Moderate Focus)
Important but can handle some interruptions:

- [ ] Code reviews
- [ ] Testing and validation
- [ ] Documentation
- [ ] Refactoring

### Low-Leverage Work (Shallow Tasks)
Necessary but batch these together:

- [ ] Email and communication
- [ ] Meeting attendance
- [ ] Administrative tasks
- [ ] Routine maintenance

---

## AI-Powered Sprint Planning

### Ask NOVA Agent for Insights
```
"What did I accomplish last week?"
"What patterns do you notice in my work?"
"How much time did similar tasks take in the past?"
"What's my average deep work hours per week?"
"Am I overcommitting based on my historical velocity?"
```

NOVA can analyze your past activity to help with realistic planning.

### NOVA-Assisted Time Estimates
For each major task, ask:
```
"How long did it take me to do [similar task] last time?"
"What's my average time for [type of work]?"
```

---

## Risk & Dependencies

### Potential Blockers
What could prevent you from achieving your outcomes?

1. **Blocker:** [Description]
   - **Mitigation:** [How to prevent or work around]
   - **Owner:** [Who can unblock]

2. **Blocker:** [Description]
   - **Mitigation:** [How to prevent or work around]
   - **Owner:** [Who can unblock]

### Dependencies on Others
What are you waiting for?

- [ ] [Dependency 1] - Waiting on: [Person/Team]
- [ ] [Dependency 2] - Waiting on: [Person/Team]

**Action:** Set up check-ins or follow-ups

---

## Weekly Retrospective (End of Week - 30 minutes)

### 1. Outcome Achievement
**Did we achieve our target outcomes?**

| Outcome | Target | Actual | Status |
|---------|--------|--------|--------|
| [Outcome 1] | [Target metric] | [Actual result] | ✅/⚠️/❌ |
| [Outcome 2] | [Target metric] | [Actual result] | ✅/⚠️/❌ |
| [Outcome 3] | [Target metric] | [Actual result] | ✅/⚠️/❌ |

**Overall Sprint Success Rate:** ___% of outcomes achieved

### 2. What Went Well (Celebrate Wins)
-
-
-

**Why did these things work?**

### 3. What Didn't Go Well (Learn & Improve)
-
-
-

**Root causes (not just symptoms):**

### 4. Surprises & Learnings
What did you learn that will change how you work?
-
-

### 5. Experiments to Try Next Week
Pick 1-3 small improvements:
- [ ] [Experiment 1] - Hypothesis: [What you think will happen]
- [ ] [Experiment 2] - Hypothesis: [What you think will happen]
- [ ] [Experiment 3] - Hypothesis: [What you think will happen]

---

## Key Metrics & Health Indicators

### Productivity Metrics
- **Deep Work Hours:** ___ / 15-20 target (___%)
- **Context Switches:** ___ times (lower is better)
- **Meeting Load:** ___ hours (target: <20% of time)
- **Outcomes Completed:** ___ / ___ (___%)

### Quality Metrics
- **Build Success Rate:** ___% (target: >95%)
- **Test Coverage:** ___% (target: >80%)
- **Production Incidents:** ___ (target: 0 critical)
- **Code Review Turnaround:** ___ hours average

### Wellbeing Indicators
- **Total Hours Worked:** ___ (target: <40/week)
- **Weekend Work:** ___ hours (target: 0)
- **Days Without Breaks:** ___ (target: 0)
- **Energy Level:** Low/Medium/High
- **Stress Level:** Low/Medium/High

**Health Status:**
- [ ] Green - Sustainable pace
- [ ] Yellow - Warning signs
- [ ] Red - Burnout risk, need intervention

---

## Technical Focus Areas

### 1. [Focus Area, e.g., "Web Automation"]
**Current State:** [Where things stand]
**Target State:** [Where you want to be]
**Key Initiatives:**
- [ ] [Initiative 1]
- [ ] [Initiative 2]

### 2. [Focus Area, e.g., "Testing"]
**Current State:** [Where things stand]
**Target State:** [Where you want to be]
**Key Initiatives:**
- [ ] [Initiative 1]
- [ ] [Initiative 2]

### 3. [Focus Area, e.g., "Infrastructure"]
**Current State:** [Where things stand]
**Target State:** [Where you want to be]
**Key Initiatives:**
- [ ] [Initiative 1]
- [ ] [Initiative 2]

---

## Learning & Growth Goals

### Skills to Develop This Week
- [ ] [Skill 1] - Time allocated: ___ hours
- [ ] [Skill 2] - Time allocated: ___ hours

### Resources & References
- [Link to documentation, tutorial, or course]
- [Link to example project or reference]

### Knowledge Sharing
What can you teach or document this week?
- [ ] [Topic to document or share]
- [ ] [Code example or tutorial to create]

---

## Quick Reference Commands

### Development Workflow
```bash
# Quality checks
pnpm run quality                # Full pipeline
pnpm run quality:affected       # Only changed projects

# Testing
pnpm test                       # Run test suite
pnpm run test:unit:coverage     # Coverage report

# Monorepo operations
pnpm run build:all              # Build everything (Nx cached)
pnpm nx graph                   # Visualize dependencies
```

### NOVA Agent Weekly Queries
```bash
# Retrospective insights
"What did I accomplish this week?"
"How much deep work time did I get?"
"What patterns do you notice in my productivity?"

# Planning insights
"What should I prioritize next week?"
"Am I overcommitting based on past performance?"
"What blockers came up this week?"
```

---

## Next Week Preview

### Preliminary Goals
Based on this week's outcomes, what makes sense to tackle next?

1. [Potential outcome 1]
2. [Potential outcome 2]
3. [Potential outcome 3]

**Note:** Don't finalize until next week's planning session

### Known Constraints Next Week
- Meetings scheduled: ___ hours
- Time off planned: ___ days
- External dependencies: [List any]

---

## Notes & Context

### Decisions Made This Week
- [Decision 1] - Rationale: [Why]
- [Decision 2] - Rationale: [Why]

### Technical Debt Identified
- [Debt item 1] - Priority: High/Med/Low
- [Debt item 2] - Priority: High/Med/Low

### Ideas to Explore Later
Capture ideas that aren't priorities now but might be valuable:
-
-
-

---

## Weekly Review Checklist

Before closing the week:
- [ ] Update TASK_MANAGEMENT_SYSTEM.md with learnings
- [ ] Complete daily reflection for Friday
- [ ] Review and celebrate wins with team (if applicable)
- [ ] Document blockers and dependencies
- [ ] Archive completed work
- [ ] Clear workspace for fresh start Monday
- [ ] Set boundaries - no work until next week

---

**Weekly Planning Template v2.0** | AI-Powered by NOVA Agent | Flexible, outcome-focused, sustainable

**Remember:**
- Focus on outcomes, not output
- Plan for 80% capacity, not 100%
- Protect your deep work time
- Celebrate wins, learn from misses
- Sustainable pace beats heroic sprints
