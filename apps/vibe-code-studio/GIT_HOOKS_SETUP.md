# Git Hooks Setup for DeepCode Editor

## Overview

This project uses git hooks to enforce code quality and prevent errors from being committed. The hooks are managed by Husky and lint-staged.

## Installed Hooks

### 1. Pre-commit Hook

- **Purpose**: Runs linting and formatting checks on staged files before allowing a commit
- **What it does**:
  - Runs ESLint on JavaScript/TypeScript files
  - Runs Prettier to format code
  - Checks TypeScript types with `tsc --noEmit`
- **Location**: `.husky/pre-commit`

### 2. Commit Message Hook

- **Purpose**: Validates commit message format
- **What it does**:
  - Ensures commit messages follow conventional commit format
  - Examples: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- **Location**: `.husky/commit-msg`

### 3. Pre-push Hook

- **Purpose**: Runs tests before pushing to remote
- **What it does**:
  - Runs all test suites
  - Prevents pushing if tests fail
- **Location**: `.husky/pre-push`

## Configuration Files

### package.json

```json
{
  "scripts": {
    "prepare": "husky install",
    "skip-hooks": "bash scripts/skip-hooks.sh",
    "check-all": "npm run lint && npm run test && npx tsc --noEmit"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### commitlint.config.js

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci'],
    ],
  },
};
```

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Usage

### Normal Workflow

1. Make your code changes
2. Stage files: `git add .`
3. Commit with proper message: `git commit -m "feat: add new feature"`
4. Push to remote: `git push`

The hooks will automatically:

- Format your code
- Check for linting errors
- Validate TypeScript types
- Ensure proper commit message format
- Run tests before push

### Emergency Bypass

If you need to bypass hooks in an emergency:

```bash
# Skip all hooks for one commit
npm run skip-hooks

# Or manually skip specific hooks
HUSKY=0 git commit -m "emergency: bypass hooks"
git commit --no-verify -m "emergency: bypass hooks"
```

⚠️ **Warning**: Only bypass hooks in true emergencies. Always fix the issues afterward.

## Troubleshooting

### Hook Not Running

1. Ensure Husky is installed: `npm run prepare`
2. Check hook permissions: `ls -la .husky/`
3. Reinstall if needed: `rm -rf .husky && npm run prepare`

### Lint Errors

1. Run `npm run lint` to see all errors
2. Try auto-fix: `npm run lint -- --fix`
3. Fix remaining errors manually

### Type Errors

1. Run `npx tsc --noEmit` to see all TypeScript errors
2. Fix type issues in the reported files

### Test Failures

1. Run `npm test` to see failing tests
2. Fix the failing tests before pushing

## Benefits

1. **Consistent Code Style**: Prettier ensures all code follows the same formatting
2. **Catch Errors Early**: ESLint and TypeScript checks prevent buggy code
3. **Clear Commit History**: Conventional commits make the history readable
4. **Stable Main Branch**: Tests run before push keep the main branch working

## Contributing

When contributing to this project:

1. Follow the conventional commit format
2. Ensure all hooks pass before pushing
3. Add tests for new features
4. Update documentation as needed

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md)
