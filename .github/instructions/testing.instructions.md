---
applyTo: '**/*.{test,spec}.{ts,tsx,js,jsx}'
name: "Testing Best Practices"
description: "Guidelines for writing and maintaining tests across the monorepo"
---

## Testing Philosophy

Write tests that provide confidence, not just coverage. Focus on behavior over implementation details.

## Test Structure

### File Organization
```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
  hooks/
    useAnalytics/
      useAnalytics.ts
      useAnalytics.test.ts
  utils/
    validation.ts
    validation.test.ts
```

### Naming Conventions
- Test files: `*.test.tsx` or `*.spec.ts`
- Test suites: `describe('ComponentName', () => {})`
- Test cases: `it('should do something specific', async () => {})`

## React Testing

### Testing Library Best Practices
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<LoginForm onSubmit={onSubmit} />);
    
    // Query by role, label, or test ID
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Assert behavior, not implementation
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### Query Priority
1. `getByRole` - Accessible queries (buttons, inputs, headings)
2. `getByLabelText` - Form inputs with labels
3. `getByPlaceholderText` - Inputs with placeholder
4. `getByText` - Text content
5. `getByTestId` - Last resort only

### Avoid
- ❌ `container.querySelector()` - Too implementation-specific
- ❌ `wrapper.find()` - Use Testing Library queries
- ❌ Testing internal state - Test behavior instead
- ❌ Snapshot tests for UI - Brittle and low value

## E2E Testing (Playwright)

### Test Organization
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
```

### Best Practices
- Use semantic locators: `getByRole`, `getByLabel`, `getByText`
- Wait for elements: `toBeVisible()`, `toHaveText()`
- Avoid hard-coded waits: use `waitFor` instead of `setTimeout`
- Test user flows, not implementation details

## Python Testing (pytest)

### Test Structure
```python
import pytest
from unittest.mock import Mock, patch, AsyncMock

class TestKrakenClient:
    @pytest.fixture
    def client(self):
        return KrakenClient(api_key="test", api_secret="test")
    
    @pytest.mark.asyncio
    async def test_place_order_success(self, client):
        """Should successfully place order with valid parameters"""
        # Arrange
        order_params = {
            "pair": "XBTUSD",
            "type": "buy",
            "volume": "0.1"
        }
        
        # Act
        with patch.object(client, '_make_request', new=AsyncMock()) as mock_request:
            mock_request.return_value = {"txid": ["123"]}
            result = await client.place_order(**order_params)
        
        # Assert
        assert result["txid"][0] == "123"
        mock_request.assert_called_once()
```

### Async Testing
- Use `@pytest.mark.asyncio` for async tests
- Mock async functions with `AsyncMock()`
- Use `pytest-asyncio` for async fixtures

### Coverage Requirements
```bash
# Run tests with coverage
pytest --cov=. --cov-report=html --cov-report=term

# Minimum coverage thresholds
# - Core trading logic: 90%+
# - API clients: 85%+
# - Utilities: 80%+
```

## Mock Best Practices

### When to Mock
- External APIs (Kraken, payment processors)
- Database operations (in unit tests)
- Time-dependent code (`Date.now()`, `time.time()`)
- File system operations
- Network requests

### When NOT to Mock
- Simple utilities (pure functions)
- Your own code in integration tests
- React components (test real composition)

### Mocking Examples
```typescript
// Vitest
import { vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn()
}));

// Jest
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
```

## Test Categories

### Unit Tests
- Test individual functions/methods in isolation
- Fast execution (< 100ms per test)
- No external dependencies
- High coverage of edge cases

### Integration Tests
- Test component interactions
- Include real dependencies where practical
- Test data flow between modules
- Verify API contracts

### E2E Tests
- Test complete user workflows
- Run against production-like environment
- Focus on critical paths
- Slower but high confidence

## Running Tests

### Quick Commands
```bash
# All tests
pnpm run test:all

# Unit tests only
pnpm run test:unit

# Watch mode
pnpm run test:unit:watch

# E2E tests
pnpm run test

# Coverage reports
pnpm run test:coverage
```

### CI/CD Integration
- Run unit tests on every commit
- Run E2E tests on PR creation
- Generate coverage reports
- Fail build if coverage drops below threshold

## Debugging Tests

### Interactive Debugging
```bash
# Playwright UI mode
pnpm run test:ui

# Vitest UI mode
pnpm run test:unit:ui

# Debug mode with breakpoints
pnpm run test:debug
```

### Common Issues

#### Flaky Tests
- **Cause**: Race conditions, timing issues
- **Fix**: Use proper `waitFor` utilities, avoid hard timeouts
- **Prevention**: Test deterministic behavior

#### Slow Tests
- **Cause**: Too many renders, unnecessary async operations
- **Fix**: Mock expensive operations, use fake timers
- **Prevention**: Keep unit tests fast (< 100ms)

#### False Positives
- **Cause**: Testing implementation, not behavior
- **Fix**: Test from user perspective
- **Prevention**: Refactor tests when code changes frequently

## Test Data Management

### Fixtures
```typescript
// Create reusable test data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User'
};

export const mockOrder = {
  id: '123',
  pair: 'XBTUSD',
  type: 'buy',
  volume: '0.1',
  price: '45000'
};
```

### Factories
```python
# Use factory pattern for complex data
def create_order(
    order_id: str = "123",
    pair: str = "XBTUSD",
    **overrides
):
    return {
        "id": order_id,
        "pair": pair,
        "type": "buy",
        "volume": "0.1",
        **overrides
    }
```

## Coverage Goals

### Target Coverage by Area
- **Trading System**: 90%+ (financial safety)
- **API Clients**: 85%+ (error handling critical)
- **UI Components**: 80%+ (user-facing behavior)
- **Utilities**: 80%+ (widely used)
- **Configuration**: 60%+ (mostly static)

### Quality Metrics
```bash
# View coverage report
pnpm run test:coverage

# Check specific file
pnpm run test:unit -- src/components/Button.test.tsx
```

## Key Principles

1. **Test Behavior, Not Implementation** - Tests should survive refactoring
2. **Arrange-Act-Assert** - Clear test structure
3. **One Assertion Per Test** - Focus on single behavior
4. **Descriptive Test Names** - Should read like documentation
5. **Fast Feedback** - Unit tests should be instant
6. **Independent Tests** - No shared state between tests
7. **Realistic Data** - Use production-like test data

## Resources

- [Testing Library Docs](https://testing-library.com/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Guide](https://vitest.dev/guide/)
