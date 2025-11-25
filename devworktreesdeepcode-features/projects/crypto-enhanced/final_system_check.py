"""
Final System Readiness Check
Validates all critical components before live trading
"""
import asyncio
import logging
from config import Config
from kraken_client import KrakenClient
from websocket_manager import WebSocketManager
from database import Database

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def system_check():
    """Comprehensive system readiness check"""
    
    print("\n" + "="*70)
    print("FINAL SYSTEM READINESS CHECK")
    print("="*70 + "\n")
    
    passed_checks = []
    failed_checks = []
    warnings = []
    
    # Load config
    print("[1/6] Configuration Check...")
    try:
        config = Config()
        if not config.validate():
            failed_checks.append("Config validation failed")
        else:
            passed_checks.append("Configuration")
            print(f"   [+] Trading Pair: {config.trading_pairs}")
            print(f"   [+] Max Position: ${config.max_position_size}")
            print(f"   [+] Max Exposure: ${config.max_total_exposure}")
            print(f"   [+] Min Balance: ${config.min_balance_required}")
    except Exception as e:
        failed_checks.append(f"Config: {e}")
    
    # Check API connection
    print("\n[2/6] Kraken API Connection...")
    try:
        async with KrakenClient(config) as kraken:
            status = await kraken.get_system_status()
            if status.get('status') == 'online':
                passed_checks.append("API Connection")
                print(f"   [+] Kraken Status: ONLINE")
            else:
                warnings.append(f"Kraken status: {status.get('status')}")
    except Exception as e:
        failed_checks.append(f"API: {e}")
    
    # Check account balance
    print("\n[3/6] Account Balance Check...")
    try:
        async with KrakenClient(config) as kraken:
            balance = await kraken.get_account_balance()
            usd = float(balance.get('ZUSD', balance.get('USD', 0)))
            
            if usd >= config.min_balance_required:
                passed_checks.append("Balance Check")
                print(f"   [+] USD Balance: ${usd:.2f}")
                
                if usd < config.min_balance_alert:
                    warnings.append(f"Low balance warning: ${usd:.2f} < ${config.min_balance_alert}")
            else:
                failed_checks.append(f"Insufficient balance: ${usd:.2f} < ${config.min_balance_required}")
    except Exception as e:
        failed_checks.append(f"Balance: {e}")
    
    # Check database
    print("\n[4/6] Database Connection...")
    try:
        async with Database(config.db_path) as db:
            if await db.is_connected():
                passed_checks.append("Database")
                print("   [+] Database: Connected")
            else:
                failed_checks.append("Database connection failed")
    except Exception as e:
        failed_checks.append(f"Database: {e}")
    
    # Check WebSocket token
    print("\n[5/6] WebSocket Authentication...")
    try:
        async with KrakenClient(config) as kraken:
            ws_token = await kraken.get_websocket_token()
            if ws_token and 'token' in ws_token:
                passed_checks.append("WebSocket Token")
                print("   [+] WebSocket: Token obtained")
            else:
                failed_checks.append("WebSocket token unavailable")
    except Exception as e:
        failed_checks.append(f"WebSocket: {e}")
    
    # Check market data access
    print("\n[6/6] Market Data Access...")
    try:
        async with KrakenClient(config) as kraken:
            ticker = await kraken.get_ticker('XLM/USD')
            if ticker and 'XLM/USD' in ticker:
                xlm_price = float(ticker['XLM/USD']['c'][0])
                passed_checks.append("Market Data")
                print(f"   [+] XLM/USD: ${xlm_price:.4f}")
                
                # Check if price is in safe range
                if xlm_price < config.xlm_price_range_min:
                    warnings.append(f"XLM price ${xlm_price:.4f} below safe range")
                elif xlm_price > config.xlm_price_range_max:
                    warnings.append(f"XLM price ${xlm_price:.4f} above safe range")
            else:
                failed_checks.append("Ticker data unavailable")
    except Exception as e:
        failed_checks.append(f"Market data: {e}")
    
    # Print results
    print("\n" + "="*70)
    print("SYSTEM CHECK RESULTS")
    print("="*70)
    
    print(f"\n[+] PASSED: {len(passed_checks)}")
    for check in passed_checks:
        print(f"    - {check}")
    
    if warnings:
        print(f"\n[!] WARNINGS: {len(warnings)}")
        for warning in warnings:
            print(f"    - {warning}")
    
    if failed_checks:
        print(f"\n[X] FAILED: {len(failed_checks)}")
        for failure in failed_checks:
            print(f"    - {failure}")
        print("\n" + "="*70)
        print("[!] SYSTEM NOT READY FOR LIVE TRADING")
        print("="*70)
        return False
    else:
        print("\n" + "="*70)
        if warnings:
            print("[!] SYSTEM READY WITH WARNINGS")
        else:
            print("[SUCCESS] SYSTEM FULLY READY FOR LIVE TRADING!")
        print("="*70)
        return True


if __name__ == "__main__":
    asyncio.run(system_check())
