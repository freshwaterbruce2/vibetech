# TypeScript Project Setup Checklist

**Use this checklist when starting ANY new TypeScript project**

## ✅ Initial Setup (15 minutes)

### 1. Copy Template Files
```bash
- [ ] Copy .husky/ directory
- [ ] Copy .github/workflows/ directory
- [ ] Copy .vscode/ directory
- [ ] Copy .lintstagedrc.js
- [ ] Copy .eslintrc.js
- [ ] Copy .prettierrc.js
- [ ] Copy tsconfig.json
- [ ] Copy package.template.json → package.json (merge dependencies)
```

### 2. Install Dependencies
```bash
- [ ] Run: pnpm install
- [ ] Verify husky installed: ls .husky
- [ ] Verify TypeScript version: pnpm list typescript
```

### 3. Configure Git Hooks
```bash
- [ ] Run: pnpm prepare
- [ ] Test pre-commit: touch test.ts && git add test.ts && git commit -m "test"
- [ ] Verify hook runs and checks TypeScript
- [ ] Remove test file: git reset HEAD~1 && rm test.ts
```

### 4. Configure VSCode
```bash
- [ ] Install recommended extensions (check .vscode/extensions.json)
- [ ] Restart VSCode
- [ ] Verify TypeScript errors show inline (create intentional error)
- [ ] Verify auto-format on save works
```

### 5. Configure GitHub Actions
```bash
- [ ] Push code to GitHub
- [ ] Go to Actions tab
- [ ] Verify workflow appears
- [ ] Create test PR to verify CI runs
```

## ✅ Team Setup (if working with others)

### 6. Document for Team
```bash
- [ ] Add section to project README about TypeScript requirements
- [ ] Share DEVELOPMENT_WORKFLOW.md with team
- [ ] Schedule team meeting to review standards
```

### 7. Branch Protection Rules
```bash
- [ ] Go to GitHub → Settings → Branches
- [ ] Protect main branch
- [ ] Require status checks: "TypeScript Quality Check"
- [ ] Require PR reviews before merge
- [ ] Require conversation resolution
```

### 8. Code Review Guidelines
```bash
- [ ] Add PR template mentioning TypeScript checks
- [ ] Add rule: No TypeScript errors allowed in PRs
- [ ] Add rule: No @ts-ignore without detailed comment
```

## ✅ Verification (10 minutes)

### 9. Test the Pipeline
```bash
- [ ] Create intentional TypeScript error
- [ ] Try to commit → Should fail with error message
- [ ] Fix error
- [ ] Commit successfully
- [ ] Push to branch
- [ ] Verify CI runs and passes
```

### 10. Document Project-Specific Rules
```bash
- [ ] Add any custom TypeScript rules to tsconfig.json
- [ ] Add any custom ESLint rules to .eslintrc.js
- [ ] Document in project README
```

## ✅ Maintenance Setup

### 11. Schedule Regular Checks
```bash
- [ ] Weekly: Run pnpm typecheck:strict
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Review and tighten TypeScript settings
```

### 12. Monitoring
```bash
- [ ] Set up alerts for CI failures
- [ ] Track TypeScript error metrics
- [ ] Review pre-commit hook bypass attempts
```

## 🎯 Success Criteria

Your project is properly set up when:
- ✅ Pre-commit hook prevents commits with TypeScript errors
- ✅ Pre-push hook runs full type check
- ✅ CI/CD fails on any TypeScript errors
- ✅ VSCode shows TypeScript errors inline
- ✅ All team members have same VSCode setup
- ✅ Protected branches prevent merging PRs with errors

## 🆘 Common Setup Issues

### "Husky hooks not running"
```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### "VSCode not showing errors"
```bash
# Restart TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Check workspace TypeScript version
Check .vscode/settings.json has "typescript.tsdk": "node_modules/typescript/lib"
```

### "CI failing but local passes"
```bash
# Match CI environment exactly
Use same Node version
Use same pnpm version
Use same TypeScript version (locked with -E flag)
```

---

**Time to Complete:** ~30 minutes for initial setup
**Time Saved:** Hours/weeks of debugging TypeScript errors later

**Print this checklist and keep it handy for every new project!**
