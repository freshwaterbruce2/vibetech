import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Percent, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTradingMetrics, getTradingBotStatus, listenToTradingMetrics, type TradingMetrics } from '@/lib/tauri';

export function TradingMetricsDisplay() {
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null);
  const [botStatus, setBotStatus] = useState<{
    isRunning: boolean;
    lastHeartbeat: string | null;
    circuitBreakerStatus: string;
  } | null>(null);

  useEffect(() => {
    // Load initial metrics
    const loadMetrics = async () => {
      try {
        const [metricsData, statusData] = await Promise.all([
          getTradingMetrics(),
          getTradingBotStatus(),
        ]);
        setMetrics(metricsData);
        setBotStatus(statusData);
      } catch (error) {
        console.error('Failed to load trading metrics:', error);
      }
    };

    loadMetrics();

    // Listen for metric updates
    const setupListener = async () => {
      try {
        const unlisten = await listenToTradingMetrics((newMetrics) => {
          setMetrics(newMetrics);
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup metrics listener:', error);
        return () => {};
      }
    };

    const listenerPromise = setupListener();

    // Refresh metrics every 5 seconds
    const interval = setInterval(loadMetrics, 5000);

    return () => {
      clearInterval(interval);
      listenerPromise.then((unlisten) => unlisten());
    };
  }, []);

  if (!metrics || !botStatus) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading metrics...</div>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = metrics.profitLoss >= 0;

  return (
    <div className="space-y-4">
      {/* Bot Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Trading Bot Status</CardTitle>
            <Badge variant={botStatus.isRunning ? 'success' : 'destructive'}>
              {botStatus.isRunning ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Circuit Breaker:</span>
              <span className="font-medium">{botStatus.circuitBreakerStatus}</span>
            </div>
            {botStatus.lastHeartbeat && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Heartbeat:</span>
                <span className="font-medium">
                  {new Date(botStatus.lastHeartbeat).toLocaleTimeString()}
                </span>
              </div>
            )}
            {metrics.activePosition && (
              <Badge variant="warning" className="w-full justify-center">
                Active Position Open
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* P/L */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {isProfitable ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              Profit/Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
              {isProfitable ? '+' : ''}${metrics.profitLoss.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Total Trades */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTrades}</div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.winRate * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Last Trade */}
      {metrics.lastTradeTime && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Trade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(metrics.lastTradeTime).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
