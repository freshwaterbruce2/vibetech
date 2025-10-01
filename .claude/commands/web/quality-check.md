---
allowed-tools: Bash(npm run quality:*), Bash(npm run lint:*), Bash(npm run typecheck:*), Bash(npm run test:*), Bash(npm run build:*)
description: Run complete quality pipeline for the web application
argument-hint: [fix]
---

# Web Application Quality Check

Run the complete quality pipeline for the React/TypeScript web application.

## Tasks to perform:
1. Run linting checks (with auto-fix if "fix" argument provided)
2. Run TypeScript compilation check
3. Run tests
4. Attempt production build

## Command execution:

${1:+First, let me run quality checks with auto-fix enabled:}
${1:+!npm run quality:fix}

${1:-Running standard quality check without auto-fix:}
${1:-!npm run quality}

## Analysis:
Based on the quality check results above, I'll:
- Identify any linting issues
- Check for TypeScript compilation errors
- Review test failures
- Verify build success

$ARGUMENTS