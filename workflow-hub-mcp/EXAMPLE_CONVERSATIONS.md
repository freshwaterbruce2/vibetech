# Example Conversations with Workflow Hub MCP

Real examples of how to use the Workflow Hub MCP server in Claude Desktop.

---

## Example 1: Morning Check-In

**You:**
> Good morning! How's my crypto bot doing? Any issues overnight?

**Me:**
> Good morning! Let me check your crypto trading bot status...
>
> 🤖 **Trading Bot Status**: ✅ RUNNING
>
> ⏱️ **Last Trade**: 12 minutes ago (BUY XLM/USD)
>
> 💼 **Open Positions**: 1
>    📈 XLM/USD: 1000 @ $0.0850 (P&L: +$0.73)
>
> ✅ **Failed Orders (24h)**: None
>
> Everything looks healthy! The bot is actively trading and you have one profitable position open.

---

## Example 2: Debugging Trading Issues

**You:**
> My bot hasn't traded in 2 hours. What's wrong?

**Me:**
> Let me investigate... checking bot status and recent errors.
>
> 🤖 **Trading Bot Status**: ⛔ STOPPED
>
> I found the issue. Let me check the database for error details...
>
> ⚠️ **Failed Orders (24h)**: 5
>    - "Insufficient funds" (occurred 5 times)
>    - All failures started at 8:42 AM
>
> **Issue**: The bot ran out of available balance. Last successful trade depleted your trading capital.
>
> **Recommended Actions:**
> 1. Check your Kraken account balance
> 2. Close open positions if needed
> 3. Restart the bot once balance is confirmed

---

## Example 3: Resuming Work

**You:**
> What was I working on yesterday?

**Me:**
> Let me check your recent tasks and session context...
>
> 📝 **Recent Tasks**:
>
> 1. ✅ Fix deepcode-editor App.tsx rendering issue [deepcode-editor] (completed)
>    Yesterday at 4:23 PM
>
> 2. 🔄 Investigate crypto bot nonce synchronization errors [crypto-enhanced] (in_progress)
>    Yesterday at 2:15 PM
>
> 3. ✅ Update memory bank integration in workflow-hub-mcp [workflow-hub] (completed)
>    Yesterday at 11:30 AM
>
> 🔄 **Last Session Context**:
> 📅 Date: Yesterday at 6:45 PM
> 📁 Project: crypto-enhanced
> 📝 Activity: Debugging nonce errors in trading bot
>
> 💡 **Resume Work**:
> - Check if nonce fix resolved the synchronization issues
> - Run performance tests on fixed bot
> - Update documentation with findings
>
> Want to continue working on the crypto bot nonce issue?

---

## Example 4: Database Investigation

**You:**
> Show me all failed orders from the last week in the trading database

**Me:**
> Let me query the trading database...
>
> 📊 **Query Results** (8 rows):
>
> | id | pair | side | status | error_message | created_at |
> | --- | --- | --- | --- | --- | --- |
> | 234 | XLM/USD | buy | failed | Insufficient funds | 2025-10-17 08:42:15 |
> | 233 | XLM/USD | sell | failed | Insufficient funds | 2025-10-17 08:41:52 |
> | 232 | XLM/USD | buy | failed | Insufficient funds | 2025-10-17 08:41:30 |
> | 219 | XLM/USD | sell | failed | Invalid nonce | 2025-10-14 14:23:45 |
> | 218 | XLM/USD | buy | failed | Invalid nonce | 2025-10-14 14:23:22 |
> | 217 | XLM/USD | sell | failed | Invalid nonce | 2025-10-14 14:22:58 |
> | 201 | XLM/USD | buy | failed | Rate limit exceeded | 2025-10-13 09:15:33 |
> | 195 | XLM/USD | sell | failed | Rate limit exceeded | 2025-10-13 09:15:10 |
>
> **Analysis**:
> - Most recent failures: "Insufficient funds" (Oct 17)
> - Earlier this week: "Invalid nonce" errors (Oct 14)
> - Previous: Rate limiting issues (Oct 13)
>
> The nonce issues appear to be resolved, but now there's a balance problem.

---

## Example 5: Project Context Switch

**You:**
> I'm switching to work on deepcode-editor. Show me what I need to know.

**Me:**
> Let me gather context for deepcode-editor...
>
> 📁 **Project Status**: C:\dev\projects\active\desktop-apps\deepcode-editor
>
> 🔄 **Modified Files**:
>   M  src/App.tsx
>   M  src/components/AIChat.tsx
>   M  src/components/Editor.tsx
>   M  src/services/FileSystemService.ts
>
> 🌿 **Branch**: main
>
> 📝 **Recent Commits**:
>   861da62 Merge feature/phase6-enterprise - Extension Marketplace Complete
>   7961ca1 docs: add comprehensive codebase cleanup summary
>   3de22f2 test: add comprehensive crypto trading API tests
>
> 📝 **Recent Tasks for deepcode-editor**:
> 1. ✅ Fix App.tsx rendering bug (completed - yesterday)
> 2. 🔄 Add AI tab completion feature (in_progress - 2 days ago)
> 3. ✅ Implement multifile editor (completed - 3 days ago)
>
> **Current Focus**: You have uncommitted changes in App.tsx and related components. Looks like you were working on the AI Chat interface.
>
> Want me to show you the git diff to see exactly what changed?

---

## Example 6: Saving Work Before Logging Off

**You:**
> I'm done for today. Save this:
> - Fixed the crypto bot insufficient funds error by adjusting position sizes
> - Updated App.tsx to fix React 19 rendering issues
> - Ran full test suite on deepcode-editor
> Tomorrow I need to deploy the crypto fix to production

**Me:**
> ✅ Tasks saved to memory bank:
>
> 1. "Fixed crypto bot insufficient funds error by adjusting position sizes"
>    [crypto-enhanced] (completed)
>
> 2. "Updated App.tsx to fix React 19 rendering issues"
>    [deepcode-editor] (completed)
>
> 3. "Ran full test suite on deepcode-editor"
>    [deepcode-editor] (completed)
>
> 4. "Deploy crypto fix to production"
>    [crypto-enhanced] (pending)
>
> **Session saved!** Tomorrow when you ask "What was I working on?", I'll remind you about:
> - The crypto position size fixes
> - The pending production deployment
> - Your progress on deepcode-editor
>
> Have a great evening!

---

## Example 7: Running Slash Commands

**You:**
> Run /crypto:performance

**Me:**
> Executing crypto performance check...
>
> ✅ **Command**: /crypto:performance
>
> ```
> CRYPTO TRADING PERFORMANCE MONITOR
> =====================================
>
> 30-Day Performance Metrics:
> - Total Trades: 47
> - Win Rate: 54.3%
> - Average Profit: $0.12 per trade
> - Total P&L: +$5.64
> - Max Drawdown: -18.2%
>
> Weekly Performance:
> - Trades This Week: 8
> - Win Rate: 62.5%
> - Weekly P&L: +$0.96
>
> Capital Scaling Readiness: ⏳ IN PROGRESS
> ✅ Minimum trades met (47/50)
> ✅ Win rate acceptable (54.3% >= 52%)
> ✅ Positive expectancy ($0.12 > $0.01)
> ✅ Max drawdown acceptable (18.2% < 30%)
>
> Status: System is performing well! 3 more trades needed for full validation.
> ```
>
> Great news! Your bot is almost ready for capital scaling. Just 3 more trades to complete the 30-day validation period.

---

## Example 8: Complex Multi-Tool Query

**You:**
> Give me a complete status report: crypto bot health, my tasks from this week, and what projects have uncommitted changes.

**Me:**
> Let me gather all that information for you...
>
> ## 🤖 Crypto Bot Health
> **Status**: ✅ RUNNING
> **Last Trade**: 8 minutes ago
> **Open Positions**: 1 (XLM/USD, +$0.73 P&L)
> **Issues**: None
>
> ## 📝 This Week's Tasks (Last 5)
> 1. ✅ Fixed crypto position sizing bug
> 2. ✅ Updated App.tsx in deepcode-editor
> 3. 🔄 Investigate WebSocket disconnect (in progress)
> 4. ✅ Ran performance validation
> 5. ⏳ Deploy crypto fixes to production (pending)
>
> ## 📁 Projects with Changes
>
> **deepcode-editor**:
> - Modified: App.tsx, AIChat.tsx, Editor.tsx
> - Branch: main
> - 4 uncommitted files
>
> **crypto-enhanced**:
> - Modified: nonce_state.json
> - Branch: main
> - 1 uncommitted file
>
> **Summary**:
> - Crypto bot is healthy and trading normally
> - You've completed 3 tasks this week, 2 still pending
> - Two projects need commits (deepcode-editor & crypto-enhanced)
>
> Anything you want to tackle first?

---

## Example 9: Database Schema Exploration

**You:**
> Show me a summary of all my databases

**Me:**
> 📚 **Database Summary**:
>
> **TRADING Database** (C:\dev\projects\crypto-enhanced\trading.db)
>   Tables: 4
>     - trades: 47 rows
>     - orders: 89 rows
>     - positions: 12 rows
>     - performance_metrics: 30 rows
>
> **NOVA Database** (D:\databases\nova_activity.db)
>   Tables: 8
>     - deep_work_sessions: 156 rows
>     - activity_snapshots: 1,243 rows
>     - context_switches: 89 rows
>     - projects: 15 rows
>     - tasks: 234 rows
>     ... and 3 more tables
>
> **UNIFIED Database** (D:\databases\database.db)
>   Tables: 6
>     - projects: 3 rows
>     - users: 1 row
>     - icons: 0 rows
>     - sessions: 8 rows
>     - canvas_states: 0 rows
>     ... and 1 more table
>
> All databases are accessible and healthy. Want to query any specific data?

---

## Example 10: Proactive Assistance

**You:**
> I'm getting "Invalid nonce" errors in my crypto bot again

**Me:**
> Let me investigate the nonce issue for you...
>
> First, checking recent failed orders in the database...
>
> ⚠️ **Failed Orders (24h)**: 3
>    - "Invalid nonce" at 10:42:15 AM
>    - "Invalid nonce" at 10:42:52 AM
>    - "Invalid nonce" at 10:43:18 AM
>
> I see the pattern. Let me check if the bot is still running...
>
> 🤖 **Bot Status**: ✅ RUNNING (but encountering nonce errors)
>
> **Root Cause**: The nonce_state.json file might be out of sync. This usually happens when:
> 1. Bot was restarted without properly saving nonce state
> 2. Multiple instances tried to run simultaneously
> 3. System clock drifted
>
> **Recommended Fix**:
> 1. Stop the bot: `python stop_bot.py`
> 2. Reset nonce: Delete `nonce_state.json`
> 3. Restart: `python start_live_trading.py`
>
> Want me to run the `/crypto:restart` command to do this safely?

---

## Tips for Great Conversations

1. **Ask Naturally**: I'll figure out which tools to use
2. **Be Specific**: Project names, time ranges, error messages help
3. **Combine Requests**: Ask for multiple things at once
4. **Follow Up**: I remember context within a conversation
5. **Save Important Info**: Ask me to remember things for later

**Pro Tip**: Start with broad questions ("How's everything?") and drill down as needed!
