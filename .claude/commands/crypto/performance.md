---
description: Check 30-day performance metrics and capital scaling readiness
category: crypto
---

Navigate to the crypto trading system directory and run the performance monitoring dashboard.

Steps:
1. Change to crypto-enhanced directory: `cd C:\dev\projects\crypto-enhanced`
2. Run the quick status dashboard: `python check_status.py`
3. If user asks for detailed report, run: `python performance_monitor.py weekly`
4. If user asks for validation status, run: `python performance_monitor.py monthly`

Display the output in a clean format and explain any key metrics:

**Key Metrics:**
- **Win Rate**: Percentage of profitable trades (target: ≥52%)
- **Expectancy**: Expected profit per trade after fees (target: >$0.01)
- **Profit Factor**: Gross Profit / Gross Loss (target: >1.0)
- **Max Drawdown**: Largest equity decline from peak (target: <30%)

**Scaling Readiness:**
The system requires ALL 4 criteria before capital scaling:
1. Minimum 50 complete trades
2. Win rate ≥52%
3. Positive expectancy >$0.01
4. Max drawdown <30%

**Validation Timeline:**
- Started: October 13, 2025
- Complete: November 12, 2025 (30 days)
- Decision Point: Review monthly report after validation

If the system shows "READY TO SCALE", inform the user they can consider adding capital.
If any criteria are not met, explain which ones and recommend continuing monitoring.
