export interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export const PROMPTS: Prompt[] = [
  {
    name: 'morning-briefing',
    description: 'Get a comprehensive morning briefing with crypto status, recent tasks, and git status',
    arguments: [],
  },
  {
    name: 'crypto-health',
    description: 'Detailed crypto trading bot health check with positions and performance',
    arguments: [
      {
        name: 'include_performance',
        description: 'Include 30-day performance metrics',
        required: false,
      },
    ],
  },
  {
    name: 'debug-mode',
    description: 'Systematic debugging workflow for investigating issues',
    arguments: [
      {
        name: 'component',
        description: 'Component to debug (crypto-bot, web-app, database)',
        required: true,
      },
    ],
  },
  {
    name: 'deploy-checklist',
    description: 'Pre-deployment verification checklist',
    arguments: [
      {
        name: 'project',
        description: 'Project name to deploy',
        required: true,
      },
    ],
  },
  {
    name: 'weekly-review',
    description: 'Weekly progress summary with tasks completed and next steps',
    arguments: [],
  },
];

export function getPromptMessages(name: string, args?: Record<string, string>) {
  switch (name) {
    case 'morning-briefing':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Give me a comprehensive morning briefing. Please check:

1. **Crypto Trading Bot Status**
   - Is it running?
   - Last trade time
   - Open positions with P&L
   - Any failed orders in the last 24 hours

2. **Recent Work (Yesterday)**
   - Tasks I worked on
   - Projects with uncommitted changes
   - Last session context

3. **Today's Focus**
   - Pending tasks
   - Suggested next steps based on recent work

Format the response clearly with sections and emojis for readability.`,
          },
        },
      ];

    case 'crypto-health':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Perform a detailed crypto trading bot health check:

1. **System Status**
   - Bot process status (running/stopped)
   - Last successful trade timestamp
   - WebSocket connection health

2. **Current Positions**
   - All open positions
   - Entry prices and current P&L
   - Total exposure

3. **Recent Issues**
   - Failed orders (last 24 hours)
   - Error patterns
   - Nonce synchronization status

${args?.include_performance === 'true' ? `
4. **Performance Metrics (30-day)**
   - Total trades and win rate
   - Average profit per trade
   - Capital scaling readiness
` : ''}

Provide actionable recommendations if any issues are found.`,
          },
        },
      ];

    case 'debug-mode':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I need to debug the ${args?.component || 'system'}. Help me investigate systematically:

1. **Current State**
   - What's the error/symptom?
   - When did it start?
   - What changed recently?

2. **Data Gathering**
   - Check relevant logs
   - Query database for related records
   - Review recent git changes

3. **Root Cause Analysis**
   - Identify patterns
   - Compare with working state
   - Isolate the failing component

4. **Recommended Fixes**
   - Immediate mitigation steps
   - Long-term solution
   - Testing verification

Walk me through this step by step.`,
          },
        },
      ];

    case 'deploy-checklist':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Pre-deployment verification for ${args?.project}:

**1. Code Quality**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Lint checks clean
- [ ] Build succeeds

**2. Git Status**
- [ ] All changes committed
- [ ] Branch up to date with main
- [ ] No merge conflicts

**3. Dependencies**
- [ ] package.json versions correct
- [ ] No security vulnerabilities
- [ ] Lock file updated

**4. Configuration**
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] API keys configured

**5. Crypto Bot (if applicable)**
- [ ] Bot can be safely stopped
- [ ] No open positions at risk
- [ ] Backup of current state

Run through this checklist and report status for each item.`,
          },
        },
      ];

    case 'weekly-review':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Weekly Progress Review:

1. **Tasks Completed This Week**
   - Show all completed tasks from memory bank
   - Group by project
   - Highlight major achievements

2. **Active Projects**
   - Projects with recent commits
   - Current status of each
   - Blockers or challenges

3. **Crypto Trading Performance**
   - Week-over-week comparison
   - Trade count and win rate
   - Notable patterns

4. **Next Week Planning**
   - Pending tasks to prioritize
   - Suggested focus areas
   - Recommended improvements

Provide a concise summary with clear action items.`,
          },
        },
      ];

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
