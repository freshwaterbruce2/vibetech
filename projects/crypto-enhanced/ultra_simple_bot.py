"""
ULTRA-SIMPLE PROFITABLE XLM BOT
- Market orders only (GUARANTEED fills)
- Simple 5-bar momentum strategy
- $5 trades to start
- Async all the way
"""

import asyncio
import aiohttp
import hashlib
import hmac
import base64
import time
import os
import json
from datetime import datetime
import logging
from dotenv import load_dotenv
import urllib.parse
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('ultra_simple.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Force reload .env to get latest keys
load_dotenv(override=True)

class UltraSimpleBot:
    def __init__(self):
        self.api_key = os.getenv('KRAKEN_API_KEY')
        self.api_secret = os.getenv('KRAKEN_API_SECRET')
        
        # Debug: Log which keys are loaded
        logger.info(f"Loaded API Key: {self.api_key[:30] if self.api_key else 'NONE'}...")
        
        self.base_url = 'https://api.kraken.com'
        self.pair = 'XLMUSD'
        self.position = None
        self.entry_price = 0
        self.buy_volume = None  # Track how much we bought
        
        # Kraken fees: 0.26% taker (market orders) - Kraken Pro verified Oct 2025
        # Source: https://www.kraken.com/features/fee-schedule
        # Round-trip = 0.52% total fees (buy + sell)
        # Need 0.6% profit MINIMUM to break even after fees
        self.fee_per_trade = 0.0026  # 0.26% per trade (Kraken Pro taker fee)
        self.min_profit_target = 0.010  # 1.0% minimum (0.48% net after fees)
        self.optimal_profit_target = 0.015  # 1.5% optimal (0.98% net after fees)
        
        # Load last nonce
        try:
            with open('nonce_state.json', 'r') as f:
                self.last_nonce = json.load(f)['last_nonce']
        except:
            self.last_nonce = int(time.time() * 1000000)  # Microseconds
            
    def _get_nonce(self):
        """Get next nonce (must always increase)"""
        self.last_nonce += 1
        # Save it
        try:
            with open('nonce_state.json', 'w') as f:
                json.dump({'last_nonce': self.last_nonce, 'timestamp': time.time()}, f)
        except:
            pass
        return str(self.last_nonce)
        
    def _get_kraken_signature(self, urlpath, data):
        """Generate Kraken API signature"""
        postdata = urllib.parse.urlencode(data)
        encoded = (str(data['nonce']) + postdata).encode()
        message = urlpath.encode() + hashlib.sha256(encoded).digest()
        signature = hmac.new(base64.b64decode(self.api_secret), message, hashlib.sha512)
        return base64.b64encode(signature.digest()).decode()
    
    async def _api_request(self, endpoint, data=None):
        """Make Kraken API request"""
        if data is None:
            # Public endpoint
            url = f"{self.base_url}/0/public/{endpoint}"
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as resp:
                    return await resp.json()
        else:
            # Private endpoint
            data['nonce'] = self._get_nonce()  # Use managed nonce
            url = f"{self.base_url}/0/private/{endpoint}"
            headers = {
                'API-Key': self.api_key,
                'API-Sign': self._get_kraken_signature(f"/0/private/{endpoint}", data)
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, data=data) as resp:
                    return await resp.json()
    
    async def get_price(self):
        """Get current XLM price"""
        try:
            result = await self._api_request('Ticker', None)
            if result and 'result' in result:
                ticker_data = result['result'].get('XXLMZUSD', result['result'].get('XLMUSD'))
                if ticker_data:
                    return float(ticker_data['c'][0])
        except Exception as e:
            logger.error(f"Price error: {e}")
        return None
    
    async def get_balance(self):
        """Get USD balance"""
        try:
            result = await self._api_request('Balance', {})
            if result and 'result' in result:
                usd = float(result['result'].get('ZUSD', 0))
                xlm = float(result['result'].get('XXLM', 0))
                return usd, xlm
        except Exception as e:
            logger.error(f"Balance error: {e}")
        return 0, 0
    
    async def place_market_order(self, side, volume):
        """Place market order"""
        try:
            data = {
                'pair': 'XLMUSD',
                'type': side,
                'ordertype': 'market',
                'volume': str(volume)
            }
            result = await self._api_request('AddOrder', data)
            if result and 'result' in result:
                logger.info(f"[ORDER] {side.upper()} order placed: {volume} XLM")
                return True
            else:
                logger.error(f"Order failed: {result.get('error', 'Unknown error')}")
        except Exception as e:
            logger.error(f"Order error: {e}")
        return False
    
    async def check_momentum(self):
        """Simple momentum check"""
        try:
            # Get last 10 minutes of price data
            result = await self._api_request('OHLC?pair=XLMUSD&interval=1')
            if not result or 'result' not in result:
                return None
                
            ohlc_key = list(result['result'].keys())[0]
            candles = result['result'][ohlc_key][-10:]  # Last 10 candles
            
            prices = [float(c[4]) for c in candles]  # Close prices
            current = prices[-1]
            avg = sum(prices) / len(prices)
            
            # Momentum: current price vs average
            momentum = (current - avg) / avg * 100
            
            logger.info(f"Price: ${current:.4f} | Avg: ${avg:.4f} | Momentum: {momentum:+.2f}%")
            return current, momentum
        except Exception as e:
            logger.error(f"Momentum error: {e}")
        return None
    
    async def run(self):
        """Main loop"""
        logger.info("="*60)
        logger.info("OPTIMIZED BOT - Adapted for Low-Volatility Markets")
        logger.info("FEE-AWARE TRADING: 0.26% per trade (0.52% round-trip)")
        logger.info("MARKET-ADAPTIVE MODE:")
        logger.info("  * Buy signal: +0.1% momentum (optimized for flat markets)")
        logger.info("  * Profit target: 1.5% gross (0.98% net after fees)")
        logger.info("  * Stop loss: -0.2% momentum (balanced risk)")
        logger.info("="*60)
        
        usd, xlm = await self.get_balance()
        logger.info(f"Balance: ${usd:.2f} USD | {xlm:.2f} XLM")
        
        if usd < 5:
            logger.error(f"Insufficient balance: ${usd:.2f}. Need at least $5")
            return
        
        while True:
            try:
                result = await self.check_momentum()
                if not result:
                    await asyncio.sleep(60)
                    continue
                    
                current_price, momentum = result
                
                # BUY: Adaptive momentum signal for low-volatility markets
                if momentum > 0.1 and not self.position:  # LOWERED: 0.1% threshold for flat markets
                    # Calculate volume - need at least $6.50 for 20 XLM minimum at current prices
                    trade_amount = 7.0  # Increased from 5.0 to ensure we meet 20 XLM minimum
                    volume = round(trade_amount / current_price, 1)
                    
                    if volume >= 20:  # Kraken minimum
                        if await self.place_market_order('buy', volume):
                            self.position = 'long'
                            self.entry_price = current_price
                            self.buy_volume = volume  # Save how much we bought
                            logger.info(f"[BUY] AGGRESSIVE BUY {volume} XLM at ${current_price:.4f} (${trade_amount:.2f})")
                    else:
                        logger.warning(f"Trade size too small: {volume} XLM < 20 minimum. Need ${20 * current_price:.2f}+")
                
                # SELL: Tight stop loss (-0.3%) OR 2% profit (1.2% after fees)
                elif self.position == 'long':
                    profit_pct = (current_price - self.entry_price) / self.entry_price * 100
                    
                    # Calculate net profit after fees
                    gross_profit_pct = profit_pct
                    net_profit_pct = gross_profit_pct - (self.fee_per_trade * 2 * 100)  # Buy + Sell fees
                    
                    if momentum < -0.2 or gross_profit_pct > 1.5:  # ADJUSTED: Tighter targets for flat market
                        # Sell the exact amount we bought (stored in self.buy_volume)
                        sell_volume = getattr(self, 'buy_volume', None)
                        
                        if not sell_volume:
                            # Fallback: check actual balance
                            usd, xlm = await self.get_balance()
                            sell_volume = round(xlm, 1) if xlm >= 20 else None
                        
                        if sell_volume and sell_volume >= 20:
                            if await self.place_market_order('sell', sell_volume):
                                reason = "STOP LOSS" if momentum < -0.3 else "PROFIT TARGET"
                                logger.info(f"[SELL] AGGRESSIVE SELL ({reason}) {sell_volume} XLM at ${current_price:.4f} | Gross: {gross_profit_pct:+.2f}% | Net: {net_profit_pct:+.2f}%")
                                self.position = None
                                self.buy_volume = None
                        else:
                            logger.error(f"Cannot sell: insufficient volume ({sell_volume} XLM)")
                
                await asyncio.sleep(60)  # Check every minute
                
            except KeyboardInterrupt:
                logger.info("Bot stopped")
                break
            except Exception as e:
                logger.error(f"Main loop error: {e}")
                await asyncio.sleep(60)

if __name__ == "__main__":
    bot = UltraSimpleBot()
    asyncio.run(bot.run())
