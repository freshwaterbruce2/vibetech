# Parallel Development Strategy for DeepCode Editor

## Current Setup

- **Instance 1**: Working on Git integration and multi-agent features (Claude Swarm)
- **Instance 2**: Working on core AI improvements and other features

## Avoiding Conflicts

### 1. Feature Branches

Instead of both working on main, use feature branches:

```bash
# Instance 1 (Git/Multi-agent features)
git checkout -b feature/multi-agent-system

# Instance 2 (AI improvements)
git checkout -b feature/ai-enhancements
```

### 2. File Ownership

To avoid conflicts, assign clear ownership of files:

#### Instance 1 Files (Git/Multi-agent):

- `/src/services/GitService.ts`
- `/src/services/ai/MultiAgentReview.ts`
- `/src/services/SessionManager.ts`
- `/src/services/MCPToolRegistry.ts`
- `/src/components/GitPanel.tsx`
- `/src/components/MultiAgentReviewPanel.tsx`
- `/src/hooks/useGit.ts`
- All Git-related tests

#### Instance 2 Files (AI/Core):

- `/src/services/DeepSeekService.ts`
- `/src/services/AutonomousAgent.ts`
- `/src/components/AIChat.tsx` (original version)
- `/src/components/Editor.tsx`
- `/src/hooks/useAIChat.ts`
- Core AI functionality tests

#### Shared Files (Coordinate changes):

- `/src/App.tsx`
- `/src/types/index.ts`
- `package.json`
- Configuration files

### 3. Communication Strategy

Create a shared status file to track what each instance is working on:

```bash
# Create a status file
touch .claude-instances-status.md
```

Update this file at the start of each session with:

- Current branch
- Files being modified
- Features being implemented
- Any blockers or dependencies

### 4. Integration Points

When integrating features from both instances:

1. **Instance 1** commits and pushes to feature branch:

   ```bash
   git add .
   git commit -m "feat: Add multi-agent review system"
   git push origin feature/multi-agent-system
   ```

2. **Instance 2** commits and pushes to its feature branch:

   ```bash
   git add .
   git commit -m "feat: Enhance AI chat capabilities"
   git push origin feature/ai-enhancements
   ```

3. **Manual Integration** (by you):
   ```bash
   # On main branch
   git checkout main
   git merge feature/multi-agent-system
   git merge feature/ai-enhancements
   # Resolve any conflicts
   git push origin main
   ```

### 5. Best Practices

1. **Frequent Commits**: Commit often with clear messages
2. **Pull Before Starting**: Always pull latest changes
3. **Test Isolation**: Ensure tests don't interfere
4. **Clear Boundaries**: Stick to assigned files
5. **Document Changes**: Update relevant documentation

### 6. Conflict Resolution

If conflicts occur:

1. Identify which instance should take precedence
2. Use git stash to temporarily save work
3. Communicate through commit messages
4. Use the status file to coordinate

## Example Workflow

### Instance 1 Session Start:

```bash
git pull origin main
git checkout feature/multi-agent-system
# Update .claude-instances-status.md
# Work on assigned features
git add .
git commit -m "feat: Implement session persistence"
git push origin feature/multi-agent-system
```

### Instance 2 Session Start:

```bash
git pull origin main
git checkout feature/ai-enhancements
# Check .claude-instances-status.md
# Work on assigned features
git add .
git commit -m "feat: Add streaming responses"
git push origin feature/ai-enhancements
```

## Benefits

- 2x development speed
- No merge conflicts during development
- Clear feature separation
- Easy integration process
- Maintains code quality

## Tips

- Use descriptive branch names
- Keep features modular
- Test features in isolation
- Document integration points
- Regular synchronization
