---
description: Run all PowerShell test suites for digital-content-builder project
model: sonnet
---

You are automating the test suite execution for the digital-content-builder web application. Execute all test scripts in sequence and provide a consolidated report.

## Step 1: Initialize Test Run

Report to the user:
```
════════════════════════════════════════
  DIGITAL CONTENT BUILDER - TEST SUITE
════════════════════════════════════════
Starting comprehensive test execution...
Project: digital-content-builder
Location: C:\dev\projects\active\web-apps\digital-content-builder
════════════════════════════════════════
```

## Step 2: Run Test Suite 1 - Main Test Suite

Execute this PowerShell command:
```powershell
cd 'C:\dev\projects\active\web-apps\digital-content-builder'; powershell -ExecutionPolicy Bypass -File test-suite.ps1
```

Present the output with this header:
```
────────────────────────────────────────
  TEST SUITE 1: test-suite.ps1
────────────────────────────────────────
```

Capture the exit code and output. Store the result (pass/fail) for the final summary.

If the script doesn't exist, report:
"⚠ test-suite.ps1 not found - skipping"

If the script runs successfully (exit code 0), note:
"✓ test-suite.ps1 PASSED"

If the script fails (exit code non-zero), note:
"✗ test-suite.ps1 FAILED"

## Step 3: Run Test Suite 2 - Simple Tests

Execute this PowerShell command:
```powershell
cd 'C:\dev\projects\active\web-apps\digital-content-builder'; powershell -ExecutionPolicy Bypass -File test-simple.ps1
```

Present the output with this header:
```
────────────────────────────────────────
  TEST SUITE 2: test-simple.ps1
────────────────────────────────────────
```

Capture the exit code and output. Store the result for the final summary.

If the script doesn't exist, report:
"⚠ test-simple.ps1 not found - skipping"

If the script runs successfully, note:
"✓ test-simple.ps1 PASSED"

If the script fails, note:
"✗ test-simple.ps1 FAILED"

## Step 4: Run Test Suite 3 - Enhanced Functions Tests

Execute this PowerShell command:
```powershell
cd 'C:\dev\projects\active\web-apps\digital-content-builder'; powershell -ExecutionPolicy Bypass -File test-enhanced-functions.ps1
```

Present the output with this header:
```
────────────────────────────────────────
  TEST SUITE 3: test-enhanced-functions.ps1
────────────────────────────────────────
```

Capture the exit code and output. Store the result for the final summary.

If the script doesn't exist, report:
"⚠ test-enhanced-functions.ps1 not found - skipping"

If the script runs successfully, note:
"✓ test-enhanced-functions.ps1 PASSED"

If the script fails, note:
"✗ test-enhanced-functions.ps1 FAILED"

## Step 5: Generate Final Summary

After all tests complete, analyze the results and present a final summary:

```
════════════════════════════════════════
  TEST EXECUTION SUMMARY
════════════════════════════════════════

Test Results:
  [✓/✗] test-suite.ps1
  [✓/✗] test-simple.ps1
  [✓/✗] test-enhanced-functions.ps1

Overall Status: [ALL TESTS PASSED / SOME TESTS FAILED]

Passed: [count]
Failed: [count]
Skipped: [count]

════════════════════════════════════════
```

If all tests passed, include:
```
🎉 SUCCESS - All test suites completed successfully!
The digital-content-builder application is ready for deployment.
```

If any tests failed, include:
```
⚠ ATTENTION REQUIRED - Some test suites failed
Review the failure details above and fix the issues before deployment.

Next Steps:
1. Review the failed test output above
2. Fix the identified issues
3. Re-run /web:test-all to verify fixes
```

## Step 6: Additional Diagnostics (if failures detected)

If any test failed, also execute:
```powershell
cd 'C:\dev\projects\active\web-apps\digital-content-builder'; Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, StartTime, WorkingSet
```

Report:
```
────────────────────────────────────────
  DIAGNOSTIC INFO (for failed tests)
────────────────────────────────────────
Active Node Processes:
[show process info]

Common Failure Causes:
- Server not running on expected port
- API endpoints unreachable
- Environment variables not set
- Stale node processes from previous runs
────────────────────────────────────────
```

**IMPORTANT EXECUTION NOTES:**
- Execute each PowerShell command using the Bash tool with: `powershell.exe -Command "..."`
- Capture both stdout and stderr for each test script
- DO NOT stop execution if one test fails - continue to run all tests
- Track pass/fail status for each test to generate accurate summary
- Tests should run in order: test-suite.ps1 → test-simple.ps1 → test-enhanced-functions.ps1
- The final summary must clearly indicate overall status
