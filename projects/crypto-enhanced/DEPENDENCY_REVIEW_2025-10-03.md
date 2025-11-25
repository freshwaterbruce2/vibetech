# CRYPTO TRADING BOT - DEPENDENCY REVIEW REPORT
**Date:** October 3, 2025
**Project:** projects/crypto-enhanced
**Status:** ⚠️ LIVE TRADING SYSTEM ($98.82 balance, XLM/USD)

---

## EXECUTIVE SUMMARY

### ⚠️ CRITICAL ISSUES: 3
### 🔴 HIGH PRIORITY: 5
### ✅ STABLE: 6

**Recommendation:** Upgrade dependencies in DEVELOPMENT environment first, then test thoroughly before deploying to live trading.

---

## CRITICAL ISSUES (Fix Immediately)

### 🚨 Issue #1: Outdated websockets Library
**Severity:** CRITICAL
**Current:** websockets>=12.0 (2023 release)
**Required:** websockets>=15.0.1 (March 2025)

**Impact on Live Trading:**
- Older versions have known reconnection bugs
- Missing stability improvements for long-running connections
- Your Kraken WebSocket v2 connection may drop and not recover properly
- Could miss trade execution notifications

**Fix:**
```bash
pip install websockets>=15.0.1
```

**Test After Upgrade:**
- Verify WebSocket reconnection logic still works
- Test heartbeat handling
- Monitor connection stability over 24+ hours

---

### 🚨 Issue #2: pytest-asyncio v0.21.1 (BREAKING CHANGES AHEAD)
**Severity:** CRITICAL (for test suite)
**Current:** pytest-asyncio==0.21.1
**Required:** pytest-asyncio>=1.2.0

**Breaking Changes:**
The `event_loop` fixture is **REMOVED** in v1.0+

**Migration Required:**

```python
# OLD (v0.21) - WILL BREAK
def test_kraken_api(event_loop):
    result = event_loop.run_until_complete(fetch_ticker())
    assert result is not None

# NEW (v1.2) - REQUIRED
@pytest.mark.asyncio
async def test_kraken_api():
    result = await fetch_ticker()
    assert result is not None
```

**Action Plan:**
1. Update pytest.ini:
   ```ini
   [tool.pytest.ini_options]
   asyncio_mode = "auto"
   ```

2. Review all test files in `/tests` directory
3. Replace `event_loop.run_until_complete()` with `await`
4. Add `@pytest.mark.asyncio` to all async tests

---

### 🚨 Issue #3: Outdated aiohttp (Security Risk)
**Severity:** CRITICAL
**Current:** aiohttp>=3.9.1 (January 2024)
**Required:** aiohttp>=3.12.15 (July 2025)

**Security Issues Fixed:**
- CVE fixes for HTTP parsing vulnerabilities
- Connection pool memory leaks
- WebSocket client stability improvements

**Impact:**
- Your Kraken REST API calls use this library
- Order placement/cancellation could fail silently
- Memory leaks in long-running processes

**Fix:**
```bash
pip install aiohttp>=3.12.15
```

---

## HIGH PRIORITY UPGRADES

### 🔴 Issue #4: Pydantic v2.11.0 → v2.11.9
**Severity:** HIGH
**Location:** Configuration management (`.env` loading, data validation)

**Benefits of Upgrade:**
- **2x faster schema build times** (faster bot startup)
- **1.5-2x memory reduction** (important for 24/7 operation)
- Bug fixes for validation edge cases
- Better error messages

**Current Code Using Pydantic:**
- `config.py` - TradingConfig model
- `.env` file parsing with pydantic-settings
- Trade/Order data validation

**Fix:**
```bash
pip install pydantic>=2.11.9 pydantic-settings>=2.6.1
```

**Test After:**
- Verify `.env` loads correctly
- Check all config validation still works
- Run `python -c "from config import TradingConfig; print(TradingConfig())"`

---

### 🔴 Issue #5: pandas v2.0.3 → v2.2.3
**Severity:** MEDIUM-HIGH
**Location:** Trading signal calculations

**Benefits:**
- Performance improvements for time series operations
- Python 3.13 support
- Memory optimizations for large dataframes

**Fix:**
```bash
pip install pandas>=2.2.3
```

---

### 🔴 Issue #6: Development Tools Outdated
**Severity:** MEDIUM (dev workflow impact)

**Upgrades Needed:**
```bash
# Code quality tools
pip install black>=24.10.0      # 23.12.0 → 24.10.0
pip install pylint>=3.3.1       # 3.0.3 → 3.3.1  
pip install mypy>=1.13.0        # 1.7.1 → 1.13.0

# Testing tools
pip install pytest>=8.3.3       # 7.4.3 → 8.3.3
pip install pytest-cov>=6.0.0   # 4.1.0 → 6.0.0
```

**Benefits:**
- Better type checking with mypy 1.13 (catches more async bugs)
- Python 3.13 support
- Improved error messages

---

### 🔴 Issue #7: Minor Security Updates
**Severity:** LOW-MEDIUM

```bash
pip install urllib3>=2.2.3      # 2.1.0 → 2.2.3 (security patches)
pip install pyyaml>=6.0.2       # 6.0.1 → 6.0.2 (CVE fix)
pip install filelock>=3.16.1    # 3.15.4 → 3.16.1
pip install colorlog>=6.8.2     # 6.7.0 → 6.8.2
```

---

## STABLE DEPENDENCIES ✅

These are fine, no changes needed:
- `aiosqlite>=0.19.0` ✅
- `python-dotenv>=1.0.0` ✅
- `psutil>=5.9.0` ✅

---

## UPGRADE STRATEGY (RECOMMENDED)

### Phase 1: Development Environment (DO FIRST)
```bash
cd C:\dev\projects\crypto-enhanced

# 1. Backup current environment
pip freeze > requirements_backup_2025-10-03.txt

# 2. Create test branch
git checkout -b upgrade-dependencies

# 3. Install updated requirements
pip install -r requirements_UPDATED.txt

# 4. Run test suite
pytest tests/ -v

# 5. Fix any test failures (mainly pytest-asyncio changes)
```

### Phase 2: Integration Testing
```bash
# 1. Test Kraken connections
python -c "from websocket_manager import WebSocketManager; import asyncio; asyncio.run(WebSocketManager().connect())"

# 2. Test REST API
python -c "from kraken_client import KrakenClient; import asyncio; c = KrakenClient(); asyncio.run(c.get_ticker('XLM/USD'))"

# 3. Run bot in DRY RUN mode
python start_live_trading.py --dry-run  # Add this flag to your script

# 4. Monitor logs for 24 hours
tail -f trading_new.log
```

### Phase 3: Live Trading (AFTER TESTING)
```bash
# Only after 24+ hours of stable dry run testing
python start_live_trading.py
```

---

## CRITICAL pytest-asyncio MIGRATION CHECKLIST

Since your test suite will break with pytest-asyncio 1.0+, here's what to update:

### Step 1: Update pytest.ini
```ini
# Add to pytest.ini or pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

### Step 2: Find All Affected Tests
```bash
# Search for event_loop usage
grep -r "event_loop" tests/
grep -r "run_until_complete" tests/
```

### Step 3: Update Test Pattern

**BEFORE (v0.21):**
```python
def test_websocket_connection(event_loop):
    """Test WebSocket connects to Kraken"""
    manager = WebSocketManager()
    result = event_loop.run_until_complete(manager.connect())
    assert result is True
```

**AFTER (v1.2):**
```python
@pytest.mark.asyncio
async def test_websocket_connection():
    """Test WebSocket connects to Kraken"""
    manager = WebSocketManager()
    result = await manager.connect()
    assert result is True
```

### Step 4: Update Async Fixtures

**BEFORE:**
```python
@pytest.fixture
async def kraken_client():
    client = KrakenClient()
    yield client
    await client.close()
```

**AFTER:**
```python
from pytest_asyncio import fixture as async_fixture

@async_fixture
async def kraken_client():
    client = KrakenClient()
    yield client
    await client.close()
```

---

## FILES TO REVIEW AFTER UPGRADE

Based on your monorepo structure, check these files:

### Trading Bot Core
- `C:\dev\projects\crypto-enhanced\websocket_manager.py` - WebSocket v2 integration
- `C:\dev\projects\crypto-enhanced\kraken_client.py` - REST API calls
- `C:\dev\projects\crypto-enhanced\config.py` - Pydantic config models
- `C:\dev\projects\crypto-enhanced\database.py` - aiosqlite operations

### Test Files
- All files in `tests/` directory
- Look for `event_loop` parameter usage
- Look for `run_until_complete()` calls

### Configuration
- `pytest.ini` - Add asyncio_mode setting
- `.env` - Ensure still loads with pydantic-settings 2.6.1

---

## RISK ASSESSMENT

### LOW RISK (Safe to upgrade immediately):
- ✅ pyyaml, urllib3, filelock, colorlog (minor versions)
- ✅ Development tools (black, pylint, mypy, pytest-cov)

### MEDIUM RISK (Test thoroughly):
- ⚠️ pydantic/pydantic-settings (config validation)
- ⚠️ pandas (trading calculations)
- ⚠️ aiohttp (REST API)

### HIGH RISK (Test extensively before live):
- 🔴 websockets (WebSocket v2 stability)
- 🔴 pytest-asyncio (breaks test suite, needs migration)

---

## ROLLBACK PLAN

If something breaks after upgrade:

```bash
# Quick rollback
pip install -r requirements_backup_2025-10-03.txt

# Or specific packages
pip install aiohttp==3.9.1
pip install websockets==12.0
pip install pytest-asyncio==0.21.1
```

---

## QUESTIONS TO VERIFY BEFORE UPGRADING

1. ✅ Do you have a backup of current environment?
2. ✅ Is your trading bot currently stopped?
3. ✅ Do you have test coverage for WebSocket reconnection?
4. ✅ Do you have test coverage for REST API error handling?
5. ✅ Can you run in dry-run/paper trading mode first?
6. ⚠️ Do you have pytest.ini configured?
7. ⚠️ Have you reviewed all test files for event_loop usage?

---

## NEXT STEPS

### Immediate Actions:
1. ⬜ Review this document thoroughly
2. ⬜ Backup current environment: `pip freeze > requirements_backup.txt`
3. ⬜ Stop live trading temporarily
4. ⬜ Create git branch: `git checkout -b upgrade-dependencies`
5. ⬜ Install updated dependencies: `pip install -r requirements_UPDATED.txt`

### Testing Phase:
6. ⬜ Update pytest.ini with asyncio_mode setting
7. ⬜ Migrate test files (remove event_loop, add @pytest.mark.asyncio)
8. ⬜ Run test suite: `pytest tests/ -v`
9. ⬜ Test WebSocket connection stability (24 hours)
10. ⬜ Test REST API integration

### Production:
11. ⬜ Dry run trading for 24-48 hours
12. ⬜ Monitor logs for anomalies
13. ⬜ Resume live trading if stable
14. ⬜ Merge branch to main

---

## CONTACT POINTS

**Questions about:**
- pytest-asyncio migration → Check `/tests` directory structure
- Kraken WebSocket v2 → Review `websocket_manager.py`
- REST API changes → Review `kraken_client.py`
- Config validation → Review `config.py` with Pydantic models

---

**Generated:** October 3, 2025
**Reviewed By:** Claude (Anthropic)
**Priority:** HIGH (due to live trading status)
**Estimated Upgrade Time:** 2-4 hours (migration) + 24-48 hours (testing)
