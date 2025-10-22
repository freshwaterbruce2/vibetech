# Development Workflow - Zero TypeScript Errors

**Last Updated:** October 16, 2025

## 📅 Daily Workflow

### Morning Routine (5 minutes)
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
pnpm install

# 3. Run type check to ensure clean starting point
pnpm typecheck

# 4. Start development server
pnpm dev
```

### During Development

#### ✅ Good Habits
1. **Watch for red squiggly lines** - Fix TypeScript errors immediately
2. **Save frequently** - Auto-formatting happens on save
3. **Run typecheck every 30 minutes** - `pnpm typecheck`
4. **Check the Problems panel** - Keep it at 0 errors

#### ⚠️ Warning Signs
- More than 5 TypeScript errors → Stop coding, fix errors now
- Tempted to use `any` → Use `unknown` and type guards instead
- Tempted to use `@ts-ignore` → Refactor the code properly
- Pre-commit hook failing → Never use `--no-verify`

### Before Committing (2 minutes)
```bash
# 1. Run quality checks
pnpm quality

# 2. Fix any issues
pnpm quality:fix

# 3. Commit (hooks will run automatically)
git commit -m "feat: your feature description"
```

### Before Pushing (5 minutes)
```bash
# 1. Ensure all tests pass
pnpm test

# 2. Final type check
pnpm typecheck

# 3. Push (pre-push hook will verify)
git push
```

---

## 🆘 Common Scenarios

### Scenario 1: "I have 20+ TypeScript errors"

**DON'T:**
- Commit with `--no-verify`
- Add `@ts-ignore` to all of them
- Disable strict mode

**DO:**
```bash
# 1. Group errors by file
pnpm typecheck 2>&1 | grep "error TS" | awk -F':' '{print $1}' | sort | uniq -c

# 2. Fix one file at a time
# Start with the file that has the most errors

# 3. Use common patterns (see TROUBLESHOOTING.md)

# 4. Ask for help if stuck after 30 minutes
```

### Scenario 2: "Pre-commit hook is too slow"

```bash
# Option 1: Use incremental TypeScript
# Add to tsconfig.json:
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}

# Option 2: Type check only changed files (not recommended)
# Update .lintstagedrc.js - but this can miss cross-file errors
```

### Scenario 3: "CI passes locally but fails on GitHub"

```bash
# 1. Use exact same TypeScript version as CI
pnpm add -D -E typescript@5.5.3

# 2. Clear all caches
rm -rf node_modules dist .tsbuildinfo
pnpm install

# 3. Run build exactly like CI
pnpm build

# 4. Check case sensitivity (Windows vs Linux)
git mv button.tsx Button.tsx  # Force rename if needed
```

### Scenario 4: "Need to bypass hooks for emergency fix"

```bash
# Only use in TRUE emergencies (production down, security fix)
git commit --no-verify -m "fix: emergency production fix"

# Then IMMEDIATELY after:
# 1. Create a follow-up PR fixing the TypeScript errors
# 2. Document why bypass was necessary in commit message
```

---

## 🎯 Weekly Checklist

Every Friday before close:
- [ ] Run `pnpm typecheck:strict` - Catches edge cases
- [ ] Review any new `@ts-ignore` comments in codebase
- [ ] Update dependencies: `pnpm update`
- [ ] Check CI/CD success rate (should be >95%)
- [ ] Review and close any stale PRs with TypeScript errors

---

## 📊 Metrics to Track

Monitor these weekly:
1. **TypeScript Error Count**: Should always be 0
2. **Pre-commit Hook Success Rate**: Should be >95%
3. **Time to Fix TypeScript Error**: Should be <5 minutes average
4. **CI/CD TypeScript Failures**: Should be <5% of total CI runs

---

## 🚀 Productivity Tips

### VSCode Shortcuts
- `F8` - Go to next error
- `Shift+F8` - Go to previous error
- `Ctrl+.` - Quick fix/suggestions
- `Alt+Shift+F` - Format document
- `Ctrl+Shift+P` → "TypeScript: Restart TS Server" - Fixes stuck errors

### Command Aliases (add to .bashrc or .zshrc)
```bash
alias tc='pnpm typecheck'
alias tcw='pnpm typecheck:watch'
alias qf='pnpm quality:fix'
alias q='pnpm quality'
```

### Git Aliases (add to .gitconfig)
```bash
[alias]
  co = commit
  cq = !pnpm quality:fix && git commit
  pq = !pnpm quality && git push
```

---

## 🎓 Learning Resources

### When You See These Errors
- `TS2322: Type X is not assignable to type Y` → [Type Compatibility Guide](link)
- `TS2339: Property X does not exist on type Y` → [Type Narrowing Guide](link)
- `TS7053: Element implicitly has an 'any' type` → [Index Signatures Guide](link)
- `TS2375: exactOptionalPropertyTypes` → Use spread operator pattern

### Recommended Reading
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Effective TypeScript: https://effectivetypescript.com/
- Total TypeScript: https://www.totaltypescript.com/

---

**Remember:** An ounce of prevention (fixing errors immediately) is worth a pound of cure (fixing 191 errors at once).
