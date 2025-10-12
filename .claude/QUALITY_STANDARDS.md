# Code Quality Standards

Standards and best practices for maintaining high-quality code across the C:\dev monorepo.

---

## 🎯 Core Principles

1. **Type Safety First**: No implicit `any`, comprehensive type annotations
2. **Test Before Deploy**: Nothing gets merged without passing tests
3. **Async Correctness**: Proper async/await patterns, no blocking calls
4. **Security Always**: Never commit secrets, validate all inputs
5. **Readable Code**: Self-documenting code with minimal comments needed
6. **Performance Matters**: Optimize where it counts, measure first

---

## 📏 TypeScript Standards (Web App)

### Type Safety

```typescript
// ✅ GOOD: Explicit types, no any
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;  // Optional
}

function getUser(id: string): Promise<User> {
  return fetchUser(id);
}

// ❌ BAD: Implicit any
function getUser(id) {  // any parameter
  return fetchUser(id);  // any return
}

// ✅ GOOD: Unknown for dynamic data
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Invalid data type');
}

// ❌ BAD: Using any
function processData(data: any) {
  return data.toUpperCase();  // No type safety
}
```

### Null Safety

```typescript
// ✅ GOOD: Handle null/undefined
function getUsername(user: User | null): string {
  return user?.name ?? 'Anonymous';
}

// ✅ GOOD: Type guard
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// ❌ BAD: Unsafe access
function getUsername(user: User | null): string {
  return user.name;  // Runtime error if null!
}
```

### Array Safety (noUncheckedIndexedAccess)

```typescript
// ✅ GOOD: Check before access
const users: User[] = [/* ... */];
const firstUser = users[0];
if (firstUser) {  // firstUser is User | undefined
  console.log(firstUser.name);
}

// ✅ GOOD: Array methods
users.forEach(user => {  // user is definitely User
  console.log(user.name);
});

// ❌ BAD: Unchecked access
const users: User[] = [/* ... */];
console.log(users[0].name);  // Might crash!
```

### Import Conventions

```typescript
// ✅ GOOD: Use path aliases
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

// ❌ BAD: Relative imports from deep paths
import { Button } from '../../../components/ui/button';
```

---

## ⚛️ React Best Practices

### Component Patterns

```typescript
// ✅ GOOD: Functional component with proper types
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children,
  onClick
}: ButtonProps) {
  return (
    <button 
      className={cn('btn', `btn-${variant}`, `btn-${size}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ❌ BAD: Missing types, props drilling
export function Button(props) {  // No types!
  return (
    <button onClick={props.onClick}>
      {props.children}
    </button>
  );
}
```

### React 19.2 Patterns

```typescript
// ✅ GOOD: ref as prop (React 19+)
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
}

export function Input({ ref, value, onChange }: InputProps) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ❌ BAD: Using forwardRef (deprecated in React 19)
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange }, ref) => {
    return <input ref={ref} /* ... */ />;
  }
);

// ✅ GOOD: useEffectEvent for event handlers
import { useEffectEvent } from 'react';

function Chat({ serverUrl }: { serverUrl: string }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!');
  });

  useEffect(() => {
    const connection = createConnection(serverUrl);
    connection.on('connected', onConnected);
    return () => connection.disconnect();
  }, [serverUrl]);  // onConnected not in deps!
}
```

### Hooks Rules

```typescript
// ✅ GOOD: Proper dependency arrays
useEffect(() => {
  fetchData(userId);
}, [userId]);  // Includes all dependencies

// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []);  // ESLint will warn!

// ✅ GOOD: useMemo for expensive computations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ❌ BAD: Expensive computation on every render
const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));

// ✅ GOOD: useCallback for function props
const handleClick = useCallback(() => {
  onSave(formData);
}, [formData, onSave]);

// ❌ BAD: New function on every render
const handleClick = () => {  // New reference each render
  onSave(formData);
};
```

### State Management

```typescript
// ✅ GOOD: Local state for UI
function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}

// ✅ GOOD: React Query for server state
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <UserDetails user={user} />;
}

// ✅ GOOD: Context for global UI state
const ThemeContext = createContext<Theme>('light');

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// ❌ BAD: Prop drilling
function App() {
  const [theme, setTheme] = useState('light');
  return (
    <Layout theme={theme} setTheme={setTheme}>
      <Header theme={theme} setTheme={setTheme}>
        <Nav theme={theme} />
      </Header>
    </Layout>
  );
}
```

---

## 🐍 Python Standards (Trading Bot & Data Pipeline)

### Type Hints

```python
# ✅ GOOD: Complete type hints
from typing import Optional, List, Dict, Any
from decimal import Decimal

async def place_order(
    pair: str,
    side: str,
    price: Decimal,
    volume: Decimal
) -> Dict[str, Any]:
    """Place an order on Kraken Exchange."""
    # Implementation

# ❌ BAD: No type hints
async def place_order(pair, side, price, volume):
    # No way to know expected types
    pass

# ✅ GOOD: Optional for nullable
def get_user(user_id: str) -> Optional[User]:
    user = database.fetch_user(user_id)
    return user if user else None

# ❌ BAD: Ambiguous return
def get_user(user_id: str) -> User:
    return database.fetch_user(user_id)  # Might return None!
```

### Async/Await Patterns

```python
# ✅ GOOD: Proper async function
async def fetch_balance() -> Decimal:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json()
            return Decimal(data['balance'])

# ❌ BAD: Blocking call in async function
async def fetch_balance() -> Decimal:
    response = requests.get(url)  # BLOCKS event loop!
    return Decimal(response.json()['balance'])

# ✅ GOOD: TaskGroups for concurrent operations (Python 3.11+)
async def fetch_all_data() -> tuple[dict, dict]:
    async with asyncio.TaskGroup() as tg:
        balance_task = tg.create_task(fetch_balance())
        orders_task = tg.create_task(fetch_orders())
    
    return balance_task.result(), orders_task.result()

# ❌ BAD: Sequential when could be parallel
async def fetch_all_data() -> tuple[dict, dict]:
    balance = await fetch_balance()  # Wait
    orders = await fetch_orders()    # Then wait again
    return balance, orders

# ✅ GOOD: Timeout on network operations
async def fetch_with_timeout() -> dict:
    try:
        async with asyncio.timeout(5.0):  # 5 second timeout
            return await fetch_data()
    except asyncio.TimeoutError:
        logger.error("Request timed out")
        raise
```

### Error Handling

```python
# ✅ GOOD: Specific exceptions with context
async def execute_order(order: Order) -> OrderResult:
    try:
        result = await kraken_client.place_order(order)
        return result
    except aiohttp.ClientError as e:
        logger.error(f"Network error placing order: {e}")
        raise TradingError(f"Network error: {e}") from e
    except ValueError as e:
        logger.error(f"Invalid order parameters: {e}")
        raise TradingError(f"Invalid order: {e}") from e

# ❌ BAD: Bare except or broad except
async def execute_order(order: Order) -> OrderResult:
    try:
        return await kraken_client.place_order(order)
    except:  # Catches everything, even KeyboardInterrupt!
        logger.error("Error")
        return None

# ✅ GOOD: ExceptionGroup handling (Python 3.11+)
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(process_order1())
        tg.create_task(process_order2())
except* aiohttp.ClientError as e:
    logger.error(f"Network errors: {e.exceptions}")
except* ValueError as e:
    logger.error(f"Validation errors: {e.exceptions}")
```

### Logging

```python
# ✅ GOOD: Structured logging with context
logger.info(
    "Order placed successfully",
    extra={
        "order_id": order.id,
        "pair": order.pair,
        "side": order.side,
        "price": float(order.price),
        "volume": float(order.volume)
    }
)

# ❌ BAD: Print statements
print(f"Order {order.id} placed")  # No log level, no context

# ✅ GOOD: Log levels used appropriately
logger.debug("Raw API response: %s", response)  # Verbose
logger.info("Order placed: %s", order_id)       # Normal
logger.warning("Rate limit approaching")        # Attention needed
logger.error("API request failed: %s", error)   # Error occurred
logger.critical("Circuit breaker triggered!")   # Requires immediate action

# ❌ BAD: Everything at same level
logger.info("Raw API response: %s", response)
logger.info("Order placed: %s", order_id)
logger.info("Rate limit approaching")
logger.info("API request failed: %s", error)
```

### Pydantic Models

```python
# ✅ GOOD: Pydantic for validation
from pydantic import BaseModel, Field, validator
from decimal import Decimal

class Order(BaseModel):
    pair: str = Field(..., regex=r'^[A-Z]+/[A-Z]+$')
    side: str = Field(..., regex=r'^(buy|sell)$')
    price: Decimal = Field(..., gt=0)
    volume: Decimal = Field(..., gt=0)
    
    @validator('volume')
    def check_volume(cls, v):
        if v > Decimal('10.0'):
            raise ValueError('Volume exceeds max trade size')
        return v

# ❌ BAD: Manual validation
class Order:
    def __init__(self, pair: str, side: str, price: float, volume: float):
        if side not in ['buy', 'sell']:
            raise ValueError("Invalid side")
        if price <= 0:
            raise ValueError("Invalid price")
        # Tedious and error-prone
        self.pair = pair
        self.side = side
        self.price = price
        self.volume = volume
```

---

## 🧪 Testing Standards

### Web App Testing (Vitest)

```typescript
// ✅ GOOD: Descriptive test names
describe('Button component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
  
  it('applies correct variant class', () => {
    const { container } = render(<Button variant="primary">Button</Button>);
    expect(container.firstChild).toHaveClass('btn-primary');
  });
});

// ❌ BAD: Vague test names
describe('Button', () => {
  it('works', () => {
    render(<Button>Click me</Button>);
    // What is being tested?
  });
  
  it('test 2', () => {
    // Unclear what this tests
  });
});
```

### Trading Bot Testing (pytest)

```python
# ✅ GOOD: Mock all external calls
@pytest.mark.asyncio
async def test_place_order_success():
    """Test successful order placement"""
    with patch('kraken_client.KrakenClient.add_order') as mock_add:
        mock_add.return_value = {
            "txid": ["ORDER123"],
            "descr": {"order": "buy 10.0 XLM/USD @ limit 0.1234"}
        }
        
        client = KrakenClient(api_key="fake", api_secret="fake")
        result = await client.place_order(
            pair="XLM/USD",
            side="buy",
            price=Decimal("0.1234"),
            volume=Decimal("10.0")
        )
        
        assert result["txid"][0] == "ORDER123"
        mock_add.assert_called_once()

# ❌ BAD: Hitting real API
@pytest.mark.asyncio
async def test_place_order_success():
    """Test successful order placement"""
    client = KrakenClient(api_key=REAL_KEY, api_secret=REAL_SECRET)
    # DON'T DO THIS! Will place real order!
    result = await client.place_order(/* ... */)

# ✅ GOOD: Test error scenarios
@pytest.mark.asyncio
async def test_place_order_network_error():
    """Test order placement handles network errors"""
    with patch('aiohttp.ClientSession.post') as mock_post:
        mock_post.side_effect = aiohttp.ClientError("Network error")
        
        client = KrakenClient(api_key="fake", api_secret="fake")
        with pytest.raises(TradingError, match="Network error"):
            await client.place_order(/* ... */)

# ✅ GOOD: Test edge cases
@pytest.mark.asyncio
async def test_place_order_exceeds_max_size():
    """Test order placement rejects oversized orders"""
    client = KrakenClient(api_key="fake", api_secret="fake")
    
    with pytest.raises(ValueError, match="exceeds max trade size"):
        await client.place_order(
            pair="XLM/USD",
            side="buy",
            price=Decimal("0.1234"),
            volume=Decimal("100.0")  # Too large!
        )
```

### Coverage Goals

```
Critical Code (Trading Bot):
├── Order execution: 100%
├── Risk management: 100%
├── API communication: 95%+
├── Database operations: 95%+
└── Error handling: 95%+

Important Code (Web App):
├── Core user flows: 90%+
├── UI components: 80%+
├── Utilities: 100%
└── API clients: 85%+

Support Code:
├── Scripts: 70%+
├── Configuration: 80%+
```

---

## 🎨 Code Style

### General

```typescript
// ✅ GOOD: Clear, self-documenting names
function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ❌ BAD: Unclear abbreviations
function calc(x: any[]): number {
  return x.reduce((s, i) => s + i.p * i.q, 0);
}

// ✅ GOOD: Constants for magic values
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fetch(url, { timeout: DEFAULT_TIMEOUT_MS });
    } catch (error) {
      if (attempt === MAX_RETRY_ATTEMPTS - 1) throw error;
      await sleep(1000 * (attempt + 1));  // Exponential backoff
    }
  }
}

// ❌ BAD: Magic numbers
async function fetchWithRetry(url: string): Promise<Response> {
  for (let i = 0; i < 3; i++) {  // Why 3?
    try {
      return await fetch(url, { timeout: 5000 });  // Why 5000?
    } catch (error) {
      // ...
    }
  }
}
```

### Comments

```typescript
// ✅ GOOD: Comment explains WHY, not WHAT
// Using exponential backoff to avoid overwhelming server
// after rate limit errors
await sleep(1000 * Math.pow(2, attempt));

// ❌ BAD: Comment states the obvious
// Sleep for 1000 * 2^attempt milliseconds
await sleep(1000 * Math.pow(2, attempt));

// ✅ GOOD: Document complex algorithms
/**
 * Calculates trading signal using momentum strategy.
 * 
 * Algorithm:
 * 1. Calculate price change over lookback period
 * 2. If price increased > threshold, signal BUY
 * 3. If price decreased > threshold, signal SELL
 * 4. Otherwise, signal HOLD
 */
function calculateSignal(prices: number[]): Signal {
  // Implementation
}

// ✅ GOOD: TODOs with context
// TODO(bruce): Implement retry logic after API stabilizes (ETA: 2025-11-01)
// Related: https://github.com/project/issues/123
```

---

## 🔒 Security Standards

### Never Commit Secrets

```typescript
// ❌ BAD: Hardcoded secrets
const API_KEY = "sk_live_abc123";  // NEVER DO THIS

// ✅ GOOD: Environment variables
const API_KEY = import.meta.env.VITE_API_KEY;
if (!API_KEY) {
  throw new Error('VITE_API_KEY not set');
}

// ✅ GOOD: Validate environment at startup
function validateEnvironment() {
  const required = ['VITE_API_KEY', 'VITE_API_URL'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

### Input Validation

```typescript
// ✅ GOOD: Validate and sanitize inputs
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)
});

function createUser(data: unknown) {
  const validated = userSchema.parse(data);  // Throws if invalid
  // Now safe to use validated data
}

// ❌ BAD: Trust user input
function createUser(data: any) {
  database.insert({ email: data.email });  // SQL injection risk!
}
```

### API Security

```python
# ✅ GOOD: Rate limiting
from functools import wraps
import time

def rate_limit(calls_per_second: float):
    """Decorator to limit function calls per second"""
    min_interval = 1.0 / calls_per_second
    last_called = [0.0]
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
            last_called[0] = time.time()
            return await func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(1.0)  # Max 1 call per second
async def call_api():
    # Implementation
```

---

## 📊 Performance Standards

### Web App

```typescript
// ✅ GOOD: Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// ✅ GOOD: Debounce expensive operations
import { debounce } from 'lodash-es';

const searchUsers = debounce(async (query: string) => {
  const results = await api.searchUsers(query);
  setUsers(results);
}, 300);

// ❌ BAD: Search on every keystroke
function handleSearch(query: string) {
  api.searchUsers(query).then(setUsers);  // Too many requests!
}
```

### Trading Bot

```python
# ✅ GOOD: Reuse connections
class KrakenClient:
    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()

# Usage
async with KrakenClient() as client:
    await client.place_order(/* ... */)
    await client.place_order(/* ... */)
    # Single connection reused

# ❌ BAD: New connection each time
async def place_order():
    async with aiohttp.ClientSession() as session:  # New connection
        # Place order
```

---

## ✅ Quality Checklist

Before committing code, verify:

### TypeScript/React
- [ ] No `any` types (use `unknown` if truly dynamic)
- [ ] All functions have return type annotations
- [ ] Null/undefined handled with optional chaining or guards
- [ ] React hooks have proper dependency arrays
- [ ] No unused variables or imports
- [ ] `pnpm run quality` passes (lint + typecheck + test + build)

### Python
- [ ] All functions have type hints
- [ ] No blocking calls in async functions
- [ ] All network operations have timeouts
- [ ] Proper error handling (specific exceptions)
- [ ] Logging at appropriate levels
- [ ] Tests mock all external services
- [ ] `python run_tests.py` passes with 95%+ coverage

### General
- [ ] Code is self-documenting (clear names, structure)
- [ ] Comments explain WHY, not WHAT
- [ ] No secrets committed
- [ ] Security best practices followed
- [ ] Performance considered (but not prematurely optimized)
- [ ] Documentation updated if needed

---

## 🎯 Key Takeaways

1. **Type Safety**: Strict TypeScript, comprehensive Python type hints
2. **Async Correctness**: Proper async/await, no blocking calls
3. **Test Coverage**: 95%+ for critical code, 80%+ for rest
4. **Security**: Validate inputs, never commit secrets
5. **Performance**: Optimize where it matters, measure first
6. **Readability**: Code should be self-documenting
7. **Error Handling**: Specific exceptions with context
8. **Logging**: Structured, appropriate levels

Remember: **Quality is not negotiable.** Taking shortcuts leads to bugs, security issues, and technical debt. Write it right the first time.
