#!/usr/bin/env node

/**
 * Planning Creation Script
 * Helps create structured plans for multi-file changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLANS_DIR = path.join(process.cwd(), '.deepcode', 'plans');
const THRESHOLD_CONFIG = path.join(process.cwd(), '.claude', 'planning-thresholds.json');

// Ensure plans directory exists
if (!fs.existsSync(PLANS_DIR)) {
  fs.mkdirSync(PLANS_DIR, { recursive: true });
  console.log(`Created plans directory: ${PLANS_DIR}`);
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -1);
}

function createPlanTemplate(metadata) {
  return `# Implementation Plan

## Metadata
- **Created**: ${new Date().toISOString()}
- **Planner**: ${metadata.planner}
- **Assigned To**: ${metadata.assignedTo}
- **Estimated Files**: ${metadata.fileCount}
- **Complexity**: ${metadata.complexity}

## Objective
${metadata.objective || '[Describe the goal of this implementation]'}

## Scope
${metadata.scope || '[Define what is included and excluded from this task]'}

## Affected Files
${metadata.files ? metadata.files.map(f => `- ${f}`).join('\n') : '- [List all files that will be modified]'}

## Implementation Steps
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]
4. [Add more steps as needed]

## Risk Assessment
### Potential Risks
- [Risk 1]
- [Risk 2]

### Mitigation Strategies
- [Strategy 1]
- [Strategy 2]

## Testing Strategy
### Unit Tests
- [Test scenarios]

### Integration Tests
- [Test scenarios]

### Manual Testing
- [Test scenarios]

## Rollback Plan
In case of issues:
1. [Rollback step 1]
2. [Rollback step 2]

## Success Criteria
- [ ] All files comply with 360-line limit
- [ ] Modular architecture maintained
- [ ] All tests pass
- [ ] No existing functionality broken
- [ ] Documentation updated

## Notes
- **File Size Enforcement**: Remember, NO file can exceed 360 lines
- **File Naming**: Do NOT rename any existing files
- **Architecture**: Maintain modular structure throughout

---
*This plan must be approved by Claude Opus 4.1 or Claude Code before implementation by Claude Sonnet 4.5*
`;
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function gatherPlanningInfo() {
  console.log('📝 Creating Implementation Plan\n');
  console.log('This wizard will help you create a structured plan.\n');

  const metadata = {};

  // Check who's creating the plan
  metadata.planner = await promptUser('Planner (Opus 4.1/Claude Code): ') || 'Claude Opus 4.1';

  if (!metadata.planner.includes('Opus') && !metadata.planner.includes('Claude Code')) {
    console.log('\n⚠️  WARNING: Only Claude Opus 4.1 or Claude Code should create plans!');
    const proceed = await promptUser('Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Planning cancelled.');
      process.exit(0);
    }
  }

  metadata.assignedTo = 'Claude Sonnet 4.5'; // Always assigned to Sonnet for implementation
  metadata.objective = await promptUser('\nObjective (brief description): ');
  metadata.scope = await promptUser('Scope (what\'s included/excluded): ');

  const fileCountStr = await promptUser('Estimated number of files affected: ');
  metadata.fileCount = parseInt(fileCountStr) || 0;

  if (metadata.fileCount >= 3) {
    console.log('\n✅ Planning is REQUIRED (3+ files)');
  } else {
    console.log('\n💡 Planning is optional but recommended');
  }

  const filesInput = await promptUser('List affected files (comma-separated, or press Enter to skip): ');
  if (filesInput) {
    metadata.files = filesInput.split(',').map(f => f.trim());
  }

  const complexityOptions = ['low', 'medium', 'high', 'critical'];
  console.log('\nComplexity levels: ' + complexityOptions.join(', '));
  metadata.complexity = await promptUser('Complexity level: ') || 'medium';

  const description = await promptUser('Brief description for filename (optional): ');

  // Generate filename
  const timestamp = getTimestamp();
  const descPart = description ? `_${description.replace(/\s+/g, '-').toLowerCase()}` : '';
  const filename = `PLAN_${timestamp}${descPart}.md`;
  const filepath = path.join(PLANS_DIR, filename);

  // Create the plan
  const planContent = createPlanTemplate(metadata);
  fs.writeFileSync(filepath, planContent);

  console.log('\n✨ Plan created successfully!');
  console.log(`📍 Location: ${filepath}`);
  console.log('\n📋 Next steps:');
  console.log('1. Edit the plan to add specific implementation details');
  console.log('2. Have Claude Opus 4.1 review and approve');
  console.log('3. Assign to Claude Sonnet 4.5 for implementation');

  // Check thresholds
  try {
    if (fs.existsSync(THRESHOLD_CONFIG)) {
      const thresholds = JSON.parse(fs.readFileSync(THRESHOLD_CONFIG, 'utf8'));
      if (metadata.fileCount >= thresholds.thresholds.fileCount.planningRequired) {
        console.log('\n🚨 REMINDER: Planning is MANDATORY for this change!');
      }
    }
  } catch (error) {
    // Ignore threshold check errors
  }
}

// Interactive mode
async function interactiveMode() {
  await gatherPlanningInfo();
}

// Quick mode with arguments
function quickMode(args) {
  const [objective, fileCount, complexity] = args;

  const metadata = {
    planner: 'Claude Opus 4.1',
    assignedTo: 'Claude Sonnet 4.5',
    objective: objective || 'Implementation task',
    fileCount: parseInt(fileCount) || 1,
    complexity: complexity || 'medium'
  };

  const timestamp = getTimestamp();
  const filename = `PLAN_${timestamp}_quick.md`;
  const filepath = path.join(PLANS_DIR, filename);

  const planContent = createPlanTemplate(metadata);
  fs.writeFileSync(filepath, planContent);

  console.log(`✨ Plan created: ${filepath}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0 && args[0] !== '--interactive') {
  quickMode(args);
} else {
  interactiveMode().catch(console.error);
}