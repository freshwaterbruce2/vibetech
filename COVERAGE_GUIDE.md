# Code Coverage Guide for Nx Monorepo

This guide provides step-by-step instructions for measuring and improving test coverage across the monorepo's Python trading system and React web applications.

## Prerequisites

### Python (crypto-enhanced)
- ✅ Python 3.11+ with virtual environment activated
- ✅ pytest-cov installed (already in requirements.txt)
- ✅ Coverage configuration in pytest.ini

### React/TypeScript (Root)
- ✅ Vitest with @vitest/coverage-v8 installed
- ✅ Coverage configuration in vitest.config.ts
- ✅ Target thresholds: 80% for lines, functions, branches, statements

## Quick Start Commands

### Run Coverage for Specific Project

```bash
# Python trading system only
npm run crypto:coverage

# React web application only
npm run test:unit:coverage

# Both projects sequentially
npm run test:coverage

# All projects in monorepo (parallel with Nx)
npm run test:coverage:all
```

### View Coverage Reports

```bash
# Open Python HTML report in browser
npm run crypto:coverage:report

# React coverage is in: coverage/index.html
start coverage/index.html
```

## Step-by-Step Guide

### 1. Python Coverage (projects/crypto-enhanced)

#### Configuration Files

**pytest.ini** - Already configured with:
- Source path: current directory (.)
- Omits: tests/, .venv/, __pycache__/
- Output formats: terminal, HTML, JSON, XML
- HTML directory: `coverage_html/`

#### Run Python Coverage

```bash
# Method 1: Using npm script (recommended)
npm run crypto:coverage

# Method 2: Direct pytest command
cd projects/crypto-enhanced
.venv\Scripts\python.exe -m pytest --cov=. --cov-report=term-missing --cov-report=html --cov-report=json --cov-report=xml

# Method 3: Activated virtual environment
cd projects/crypto-enhanced
.venv\Scripts\activate
pytest --cov=. --cov-report=term-missing --cov-report=html
```

#### Python Coverage Output

```
Terminal Output:
- Shows coverage % per file
- Lists uncovered lines
- Summary statistics

Files Generated:
- coverage_html/index.html  → Interactive HTML report
- coverage.json             → JSON format for CI/CD
- coverage.xml              → XML format (Cobertura)
- .coverage                 → Raw coverage data
```

#### Understanding Python Coverage Reports

```bash
# Terminal shows:
Name                      Stmts   Miss  Cover   Missing
-----------------------------------------------------
kraken_client.py            245     45    82%   67-89, 123-145
trading_engine.py           189     23    88%   234-256
websocket_manager.py        156     12    92%   89-100
-----------------------------------------------------
TOTAL                      1234    123    90%

# "Missing" column shows uncovered line numbers
```

### 2. React/TypeScript Coverage (Root Project)

#### Configuration Files

**vitest.config.ts** - Already configured with:
- Provider: v8 (faster than istanbul)
- Reporters: text, json, html, lcov
- Excludes: node_modules/, test files, config files
- Thresholds: 80% across all metrics
- HTML output: `coverage/`

#### Run React Coverage

```bash
# Method 1: Using npm script (recommended)
npm run test:unit:coverage

# Method 2: Direct vitest command
npx vitest run --coverage

# Method 3: Watch mode with coverage
npx vitest --coverage --watch
```

#### React Coverage Output

```
Terminal Output:
- Shows coverage % by file
- Color-coded results (red < 80%, green ≥ 80%)
- Branch coverage details

Files Generated:
- coverage/index.html       → Interactive HTML report
- coverage/coverage-final.json → JSON format
- coverage/lcov.info        → LCOV format for CI tools
```

#### Understanding React Coverage Metrics

```
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
-------------------------------------------------------------------------------
src/components/      |   85.2  |   78.9   |   83.4  |  85.2   |
  Button.tsx         |   100   |   100    |   100   |  100    |
  Form.tsx           |   72.5  |   65.0   |   75.0  |  72.5   | 45-67, 89
src/hooks/           |   90.1  |   85.3   |   88.9  |  90.1   |
-------------------------------------------------------------------------------
All files            |   82.3  |   76.8   |   81.2  |  82.3   |

Metrics Explained:
- Stmts: Statement coverage (lines executed)
- Branch: Conditional branches tested (if/else)
- Funcs: Function coverage (functions called)
- Lines: Line coverage (similar to statements)
```

### 3. Unified Coverage with Nx

#### Nx Integration Benefits

1. **Intelligent Caching**: Coverage results cached per project
2. **Affected Detection**: Only test changed projects
3. **Parallel Execution**: Run coverage across multiple projects simultaneously
4. **Dependency Awareness**: Tests dependencies before testing dependents

#### Nx Coverage Commands

```bash
# Run coverage for all projects (parallel)
npm run test:coverage:all
# Equivalent to: nx run-many -t test:coverage

# Run coverage for affected projects only
nx affected -t test:coverage

# Run with verbose output
nx run-many -t test:coverage --verbose

# Clear Nx cache and rerun
nx reset
npm run test:coverage:all
```

#### Nx Configuration (nx.json)

```json
{
  "targetDefaults": {
    "test:coverage": {
      "dependsOn": ["^build"],
      "inputs": ["default", "^production"],
      "outputs": [
        "{projectRoot}/coverage/**",
        "{projectRoot}/coverage_html/**"
      ],
      "cache": true
    }
  }
}
```

## Coverage Reports Location

### Python (crypto-enhanced)
```
projects/crypto-enhanced/
├── coverage_html/        → HTML report (open index.html)
├── coverage.json         → JSON format
├── coverage.xml          → XML format (Cobertura)
└── .coverage             → Raw data (don't commit)
```

### React (Root)
```
coverage/
├── index.html           → Main HTML report
├── lcov-report/         → LCOV HTML report
├── coverage-final.json  → JSON format
└── lcov.info           → LCOV format
```

## Improving Coverage

### Identifying Gaps

1. **Open HTML Reports**
   ```bash
   # Python
   npm run crypto:coverage:report

   # React
   start coverage/index.html
   ```

2. **Look for Red/Yellow Highlighted Lines**
   - Red = Not covered
   - Yellow = Partially covered (branches)
   - Green = Fully covered

3. **Focus on Critical Paths**
   - Trading logic (kraken_client.py, trading_engine.py)
   - Error handling
   - Edge cases in forms and validation

### Writing Tests for Uncovered Code

#### Python Example
```python
# If kraken_client.py shows lines 67-89 uncovered:
# tests/test_kraken_client.py

def test_order_placement_edge_cases():
    """Test uncovered order placement scenarios"""
    client = KrakenClient()

    # Test uncovered lines: invalid pair
    with pytest.raises(ValueError):
        client.place_order(pair="INVALID/PAIR", volume=10)

    # Test uncovered lines: zero volume
    with pytest.raises(ValueError):
        client.place_order(pair="XLM/USD", volume=0)
```

#### React Example
```typescript
// If Form.tsx shows lines 45-67 uncovered:
// src/components/Form.test.tsx

describe('Form edge cases', () => {
  it('handles validation errors correctly', async () => {
    render(<Form />);

    // Test uncovered error handling
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/validation error/i)).toBeInTheDocument();
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Python coverage
      - name: Run Python Coverage
        run: |
          cd projects/crypto-enhanced
          python -m venv .venv
          .venv/bin/pip install -r requirements.txt
          .venv/bin/pytest --cov=. --cov-report=xml

      # React coverage
      - name: Run React Coverage
        run: |
          npm install
          npm run test:unit:coverage

      # Upload to Codecov
      - uses: codecov/codecov-action@v4
        with:
          files: ./projects/crypto-enhanced/coverage.xml,./coverage/lcov.info
          flags: monorepo
```

## Troubleshooting

### Python Coverage Issues

**Problem**: "No coverage data collected"
```bash
# Solution: Ensure pytest-cov is installed
cd projects/crypto-enhanced
.venv\Scripts\pip install pytest-cov

# Verify installation
.venv\Scripts\pip show pytest-cov
```

**Problem**: "Coverage.py warning: No data was collected"
```bash
# Solution: Check pytest.ini source path
# Ensure [coverage:run] section has: source = .
```

**Problem**: "ImportError during coverage"
```bash
# Solution: Run from project root
cd projects/crypto-enhanced
.venv\Scripts\python.exe -m pytest --cov=.
```

### React Coverage Issues

**Problem**: "Error: Unknown option '--coverage'"
```bash
# Solution: Install coverage provider
npm install --save-dev @vitest/coverage-v8
```

**Problem**: "Coverage thresholds not met"
```bash
# Temporary: Lower thresholds in vitest.config.ts
coverage: {
  thresholds: {
    lines: 60,  // Lower from 80
  }
}

# Long-term: Write more tests to reach 80%
```

**Problem**: "TypeError: Cannot read property 'config'"
```bash
# Solution: Ensure vitest.config.ts has correct structure
import { defineConfig } from 'vitest/config';
export default defineConfig({ ... });
```

### Nx Coverage Issues

**Problem**: "Task 'test:coverage' not found"
```bash
# Solution: Add to project's package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

**Problem**: "Cache not working for coverage"
```bash
# Solution: Clear Nx cache
nx reset
npm run test:coverage:all
```

## Best Practices

### 1. Run Coverage Locally Before Committing
```bash
npm run test:coverage
```

### 2. Set Coverage Thresholds
- Start: 60-70% (baseline)
- Good: 80% (current target)
- Excellent: 90%+

### 3. Focus Coverage Efforts
- **Critical**: Trading logic, payment processing
- **High**: User authentication, data validation
- **Medium**: UI components, utilities
- **Low**: Configuration files, types

### 4. Use Coverage as a Guide, Not a Goal
- 100% coverage doesn't guarantee bug-free code
- Focus on meaningful tests, not just coverage numbers
- Test edge cases and error paths

### 5. Monitor Coverage Trends
```bash
# Generate baseline
npm run test:coverage > coverage-baseline.txt

# Compare after changes
npm run test:coverage > coverage-current.txt
diff coverage-baseline.txt coverage-current.txt
```

## Summary of Commands

```bash
# Python Only
npm run crypto:coverage              # Generate Python coverage
npm run crypto:coverage:report       # Open Python HTML report

# React Only
npm run test:unit:coverage           # Generate React coverage

# Combined
npm run test:coverage                # Both Python + React (sequential)
npm run test:coverage:all            # All projects (Nx parallel)
npm run coverage:report              # Generate and open reports

# Nx Optimized
nx affected -t test:coverage         # Only changed projects
nx run-many -t test:coverage         # All projects in parallel
nx reset                             # Clear cache
```

## Next Steps

1. **Run Initial Coverage**: `npm run test:coverage`
2. **Review Reports**: Open HTML reports to identify gaps
3. **Prioritize Tests**: Focus on critical trading and payment logic
4. **Set Goals**: Target 80% coverage for critical paths
5. **Integrate CI**: Add coverage checks to GitHub Actions
6. **Monitor**: Track coverage trends over time

## Resources

- **pytest-cov**: https://pytest-cov.readthedocs.io/
- **Vitest Coverage**: https://vitest.dev/guide/coverage.html
- **Nx Caching**: https://nx.dev/concepts/how-caching-works
- **Coverage.py**: https://coverage.readthedocs.io/
