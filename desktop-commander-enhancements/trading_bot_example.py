"""
Complete Trading Bot Integration Example

This demonstrates how to integrate Desktop Commander Pro
with your crypto-enhanced trading bot at:
C:\\dev\\projects\\crypto-enhanced
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
import logging

# Add Desktop Commander to path
sys.path.insert(0, str(Path(__file__).parent))
from automation_wrapper import DesktopCommanderPro, TradingBotNotifier

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class EnhancedTradingBot:
    """
    Example trading bot with Desktop Commander Pro integration.
    
    This shows how to add notifications, error screenshots,
    and monitoring to your existing trading bot.
    """
    
    def __init__(self):
        self.dc = DesktopCommanderPro()
        self.notifier = TradingBotNotifier(self.dc)
        
        # Trading state
        self.balance = 98.82
        self.trading_pair = "XLM/USD"
        self.is_running = False
        self.total_trades = 0
        
        # Configuration
        self.screenshot_dir = Path("C:/dev/projects/crypto-enhanced/error_screenshots")
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("Enhanced Trading Bot initialized with Desktop Commander Pro")
    
    async def startup(self):
        """Start the trading bot with notification."""
        logger.info("Starting trading bot...")
        
        # Show startup notification
        await self.notifier.notify_startup(
            balance=self.balance,
            trading_pair=self.trading_pair
        )
        
        self.is_running = True
        logger.info("Trading bot started")
    
    async def shutdown(self, reason: str = "User requested"):
        """Shutdown the trading bot with notification."""
        logger.info(f"Shutting down: {reason}")
        
        await self.notifier.notify_shutdown(
            reason=reason,
            final_balance=self.balance
        )
        
        self.is_running = False
        logger.info("Trading bot stopped")
    
    async def execute_trade(self, side: str, quantity: float, price: float):
        """Execute a trade with automatic notification."""
        try:
            # Simulate trade execution
            order_id = f"ORD{self.total_trades:06d}"
            
            logger.info(f"Executing {side} {quantity} {self.trading_pair} @ ${price:.4f}")
            
            # In real bot: await self.kraken_client.place_order(...)
            await asyncio.sleep(0.5)  # Simulate network delay
            
            # Update state
            self.total_trades += 1
            if side == "buy":
                self.balance -= quantity * price
            else:
                self.balance += quantity * price
            
            # Send success notification
            await self.notifier.notify_trade_executed(
                symbol=self.trading_pair,
                side=side,
                quantity=quantity,
                price=price,
                order_id=order_id
            )
            
            logger.info(f"Trade executed successfully: {order_id}")
            return {"success": True, "order_id": order_id}
            
        except Exception as e:
            logger.error(f"Trade execution failed: {e}")
            await self.handle_error("Trade Execution", e)
            return {"success": False, "error": str(e)}
    
    async def handle_error(self, error_type: str, error: Exception):
        """Handle errors with notification and screenshot."""
        logger.error(f"{error_type} error: {error}")
        
        # Capture screenshot for debugging
        screenshot_path = await self.notifier.capture_error_screenshot(
            error_type.lower().replace(" ", "_"),
            output_dir=str(self.screenshot_dir)
        )
        
        if screenshot_path:
            logger.info(f"Error screenshot saved: {screenshot_path}")
        
        # Send error notification
        await self.notifier.notify_error(error_type, str(error)[:100])
    
    async def check_circuit_breaker(self):
        """Monitor circuit breaker conditions."""
        # Example: Check balance
        initial_balance = 98.82
        current_loss = initial_balance - self.balance
        max_loss = 10.00
        
        if current_loss >= max_loss:
            logger.warning(f"Circuit breaker triggered: Loss ${current_loss:.2f}")
            
            await self.notifier.notify_circuit_breaker(
                reason=f"Max loss exceeded: ${current_loss:.2f}",
                threshold=f"${max_loss:.2f}"
            )
            
            await self.shutdown("Circuit breaker activated")
            return True
        
        return False
    
    async def monitor_system_health(self):
        """Monitor system resources during trading."""
        stats = await self.dc.get_system_stats()
        
        cpu = stats.get("CPU_Percent", 0)
        memory = stats.get("Memory_Used_Percent", 0)
        
        logger.debug(f"System: CPU={cpu:.1f}% Memory={memory:.1f}%")
        
        # Alert if resources are high
        if cpu > 90 or memory > 90:
            logger.warning(f"High resource usage: CPU={cpu}% Memory={memory}%")
            await self.dc.show_notification(
                "⚠️ High Resource Usage",
                f"CPU: {cpu:.0f}% | Memory: {memory:.0f}%",
                duration_seconds=10
            )
    
    async def trading_loop(self):
        """Main trading loop with monitoring."""
        logger.info("Starting trading loop...")
        
        try:
            while self.is_running:
                # Check circuit breaker
                if await self.check_circuit_breaker():
                    break
                
                # Monitor system health
                if self.total_trades % 10 == 0:
                    await self.monitor_system_health()
                
                # Simulate trading logic
                await asyncio.sleep(5)
                
                # Example: Execute a trade (demo: 3 trades)
                if self.total_trades < 3:
                    await self.execute_trade(
                        side="buy" if self.total_trades % 2 == 0 else "sell",
                        quantity=50.0,
                        price=0.1950 + (self.total_trades * 0.0001)
                    )
                else:
                    logger.info("Demo complete (3 trades executed)")
                    break
                
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
            await self.shutdown("User interrupted")
        except Exception as e:
            logger.exception("Trading loop error")
            await self.handle_error("Trading Loop", e)
            await self.shutdown("Fatal error")
    
    async def run(self):
        """Main entry point."""
        try:
            await self.startup()
            await self.trading_loop()
        finally:
            if self.is_running:
                await self.shutdown("Cleanup")


async def demonstrate_features():
    """Demonstrate Desktop Commander Pro features for trading."""
    print("\n" + "=" * 80)
    print("DESKTOP COMMANDER PRO - TRADING BOT INTEGRATION DEMO")
    print("=" * 80 + "\n")
