# Crypto Trading Pre-Deployment Safety Check

Comprehensive safety validation before deploying crypto trading system changes.

## Usage
```bash
/crypto:pre-deploy-check
```

## Task
Run complete safety validation suite before deploying trading system changes:

1. **Database Integrity Check**
   ```bash
   cd projects/crypto-enhanced
   python << 'PYEOF'
import sqlite3
import json

db = sqlite3.connect('trading.db')
cursor = db.cursor()

# Check for failed orders (last 24h)
cursor.execute("""
    SELECT COUNT(*) FROM orders 
    WHERE status = 'failed' 
    AND created_at > datetime('now', '-24 hours')
""")
failed_orders = cursor.fetchone()[0]

# Check for errors in logs
with open('trading_new.log', 'r') as f:
    recent_logs = f.readlines()[-100:]
    error_count = sum(1 for line in recent_logs if 'ERROR' in line or 'CRITICAL' in line)

# Check open positions
cursor.execute("SELECT COUNT(*), SUM(unrealized_pnl) FROM positions WHERE status = 'open'")
open_positions, total_pnl = cursor.fetchone()

print(json.dumps({
    'failed_orders': failed_orders,
    'error_count': error_count,
    'open_positions': open_positions or 0,
    'total_pnl': float(total_pnl) if total_pnl else 0.0
}))

db.close()
PYEOF
   ```

2. **Configuration Validation**
   ```bash
   python << 'PYEOF'
import sys
sys.path.append('projects/crypto-enhanced')
from config import Config

config = Config()

# Verify critical settings
checks = {
    'max_position_size': config.max_position_size <= 10,
    'max_total_exposure': config.max_total_exposure <= 10,
    'trading_pair': config.trading_pair == 'XLM/USD',
    'api_key_set': bool(config.api_key),
    'api_secret_set': bool(config.api_secret)
}

print(json.dumps(checks))
PYEOF
   ```

3. **Critical File Presence**
   ```bash
   cd projects/crypto-enhanced
   
   # Check critical files exist
   files=(
       "config.py"
       "kraken_client.py"
       "trading_engine.py"
       "websocket_manager.py"
       "database.py"
       "strategies.py"
       "nonce_state_primary.json"
   )
   
   for file in "${files[@]}"; do
       if [ ! -f "$file" ]; then
           echo "MISSING: $file"
       fi
   done
   ```

4. **Generate Safety Report**
   ```
   CRYPTO TRADING PRE-DEPLOYMENT SAFETY CHECK
   ==========================================
   
   Database Health:
   ✓ Failed Orders (24h): 0 (SAFE - threshold: <5)
   ✓ Recent Errors: 2 (SAFE - threshold: <10)
   ✓ Open Positions: 0
   ✓ Unrealized P&L: $0.00
   
   Configuration Validation:
   ✓ Max Position Size: $10 (SAFE)
   ✓ Max Total Exposure: $10 (SAFE)
   ✓ Trading Pair: XLM/USD (CORRECT)
   ✓ API Key: Set
   ✓ API Secret: Set
   
   Critical Files:
   ✓ All 7 critical files present
   
   Code Changes:
   Modified Files: 3
   - strategies.py (CRITICAL)
   - trading_engine.py (CRITICAL)
   - config.py (CRITICAL)
   
   Risk Assessment: MEDIUM
   Reason: Changes to core trading logic
   
   RECOMMENDATIONS
   ===============
   ✓ SAFE TO DEPLOY
   
   Pre-Deployment Checklist:
   [✓] Database healthy
   [✓] Configuration validated
   [✓] Critical files present
   [✓] No active positions blocking deployment
   [ ] Run backtest on strategy changes
   [ ] Review git diff for unintended changes
   [ ] Verify monitoring scripts active
   [ ] Schedule deployment during low-volatility hours
   
   Post-Deployment Actions:
   1. Monitor first 10 trades closely
   2. Verify WebSocket reconnection working
   3. Check nonce synchronization
   4. Review performance_monitor.py after 24h
   
   BLOCKING ISSUES: None
   
   Status: ✅ CLEARED FOR DEPLOYMENT
   ```

5. **Optional: Run Backtest**
   If strategy files modified, offer to run quick backtest:
   ```bash
   python backtest_strategies.py --quick --trades=50
   ```

## Benefits
- Prevent deploying broken configurations
- Catch database corruption early
- Verify safety parameters maintained
- Reduce deployment risk
- Automated pre-flight checks
