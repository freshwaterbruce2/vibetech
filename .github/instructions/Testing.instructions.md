---
applyTo: '**/*.{test,spec}.{ts,tsx,js,py}'
---

## Testing Guidelines

### Web Application Testing

#### Playwright E2E Tests
```bash
pnpm run test        # Run all E2E tests
pnpm run test:ui     # Interactive debugging
pnpm run test:debug  # Debug mode with inspector
```

#### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform expected action', async ({ page }) => {
    // Arrange
    await page.goto('/feature');
    
    // Act
    await page.click('button[data-testid="action"]');
    
    // Assert
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

#### Best Practices
- Use `data-testid` attributes for reliable element selection
- Avoid CSS selectors that may change with styling
- Test user flows, not implementation details
- Use `page.waitForLoadState()` to avoid flaky tests

### Unit Tests (Vitest)
```bash
pnpm run test:unit           # Run unit tests
pnpm run test:unit:watch     # Watch mode
pnpm run test:unit:coverage  # With coverage report
```

#### Test Structure
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const onClickMock = vi.fn();
    render(<Component onClick={onClickMock} />);
    
    await screen.getByRole('button').click();
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

### Python Testing (pytest)

#### Running Tests
```bash
cd projects/crypto-enhanced
.venv\Scripts\python.exe run_tests.py
```

#### Async Tests
```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_async_operation():
    mock_client = AsyncMock()
    mock_client.get_balance.return_value = {"USD": 100.0}
    
    result = await trading_function(mock_client)
    assert result.success is True
```

#### Test Fixtures
```python
@pytest.fixture
def mock_database():
    # Setup
    db = Database(":memory:")
    yield db
    # Teardown
    db.close()

def test_database_operation(mock_database):
    # Use fixture
    result = mock_database.query("SELECT 1")
    assert result is not None
```

### Test Coverage

#### Coverage Goals
- Aim for 80%+ coverage on core business logic
- 100% coverage on critical paths (trading, risk management)
- Don't sacrifice quality for coverage metrics

#### Running Coverage
```bash
# Web application
pnpm run test:unit:coverage

# Python trading system
cd projects/crypto-enhanced
.venv\Scripts\python.exe -m pytest --cov=. --cov-report=html
```

### Mocking Best Practices

#### Mock External APIs
```typescript
// Mock fetch for API calls
vi.mock('global', () => ({
  fetch: vi.fn(),
}));

test('fetches data', async () => {
  global.fetch.mockResolvedValueOnce({
    json: async () => ({ data: 'test' }),
  });
  // ... test logic
});
```

#### Mock WebSocket Connections
```python
@pytest.mark.asyncio
async def test_websocket():
    with patch('websocket_manager.WebSocketManager') as mock_ws:
        mock_ws.connect = AsyncMock()
        # ... test logic
```

### Testing Critical Trading Logic

⚠️ **NEVER test with real API keys or real money**

```python
# ✅ Correct - Use mocks
@pytest.mark.asyncio
async def test_trade_execution(mock_kraken_client):
    mock_kraken_client.place_order = AsyncMock(return_value={"txid": "123"})
    # ... test logic

# ❌ Incorrect - Don't use real API
async def test_real_trade():
    client = KrakenClient(API_KEY, API_SECRET)  # NEVER DO THIS
    await client.place_order(...)
```

### Continuous Integration

Tests run automatically on:
- Pull requests
- Merges to main branch
- Use `pnpm run quality` before committing

### Test Naming Conventions
- Describe what is being tested: `test_user_can_login`
- Use "should" for expected behavior: `should_reject_invalid_email`
- Group related tests in describe blocks
