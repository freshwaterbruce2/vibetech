import { exec } from 'child_process';
import { promisify } from 'util';
import Database from 'better-sqlite3';

const execAsync = promisify(exec);

const CRYPTO_PATH = 'C:\\dev\\projects\\crypto-enhanced';
const TRADING_DB_PATH = `${CRYPTO_PATH}\\trading.db`;

interface CryptoStatusArgs {
  include_positions?: boolean;
  include_performance?: boolean;
}

export async function getCryptoTradingStatus(args: CryptoStatusArgs) {
  try {
    const results: string[] = [];

    // Check if trading bot is running
    const { stdout: processCheck } = await execAsync(
      `powershell -Command "Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*trading*' -or $_.CommandLine -like '*start_live_trading*' } | Select-Object -First 1"`
    );

    const isRunning = processCheck.trim().length > 0;
    results.push(`🤖 **Trading Bot Status**: ${isRunning ? '✅ RUNNING' : '⛔ STOPPED'}`);

    // Get database statistics
    const db = new Database(TRADING_DB_PATH, { readonly: true });

    // Get recent trades
    const recentTrades = db.prepare(`
      SELECT * FROM trades
      ORDER BY executed_at DESC
      LIMIT 5
    `).all();

    if (recentTrades.length > 0) {
      const lastTrade = recentTrades[0] as any;
      const tradeTime = lastTrade.executed_at || lastTrade.created_at;
      if (tradeTime) {
        const minutesAgo = Math.floor((Date.now() - new Date(tradeTime).getTime()) / 60000);
        results.push(`\n⏱️ **Last Trade**: ${minutesAgo} minutes ago (${lastTrade.side} ${lastTrade.pair})`);
      } else {
        results.push('\n⏱️ **Last Trade**: Recently (timestamp unavailable)');
      }
    } else {
      results.push('\n⏱️ **Last Trade**: No trades yet');
    }

    // Get open positions if requested
    if (args.include_positions) {
      const positions = db.prepare(`
        SELECT * FROM positions
        WHERE status = 'open'
      `).all();

      if (positions.length > 0) {
        results.push(`\n💼 **Open Positions**: ${positions.length}`);
        positions.forEach((pos: any) => {
          const pnl = parseFloat(pos.unrealized_pnl || 0).toFixed(2);
          const pnlEmoji = parseFloat(pnl) >= 0 ? '📈' : '📉';
          results.push(`   ${pnlEmoji} ${pos.pair}: ${pos.size} @ $${pos.entry_price} (P&L: $${pnl})`);
        });
      } else {
        results.push('\n💼 **Open Positions**: None');
      }
    }

    // Get failed orders in last 24 hours
    const failedOrders = db.prepare(`
      SELECT * FROM orders
      WHERE status = 'failed'
      AND created_at > datetime('now', '-24 hours')
    `).all();

    if (failedOrders.length > 0) {
      results.push(`\n⚠️ **Failed Orders (24h)**: ${failedOrders.length}`);
      failedOrders.slice(0, 3).forEach((order: any) => {
        results.push(`   - ${order.error_message || 'Unknown error'}`);
      });
    } else {
      results.push('\n✅ **Failed Orders (24h)**: None');
    }

    // Get performance metrics if requested
    if (args.include_performance) {
      try {
        const { stdout: perfOutput } = await execAsync(
          `powershell -Command "cd '${CRYPTO_PATH}'; python check_status.py"`,
          { timeout: 10000 }
        );
        results.push('\n📊 **Performance Metrics**:');
        results.push(perfOutput.trim());
      } catch (error) {
        results.push('\n📊 **Performance Metrics**: Could not retrieve (check_status.py error)');
      }
    }

    db.close();

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving crypto trading status: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
