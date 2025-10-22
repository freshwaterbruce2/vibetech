import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { PnLPoint, ChartTimeframe } from '@/types/crypto-trading';

interface PnLChartProps {
  data?: PnLPoint[];
}

const PnLChart: React.FC<PnLChartProps> = ({ data }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>({
    label: '1 Day',
    value: '1d',
    duration: 24 * 60 * 60 * 1000
  });

  // Generate mock data for demonstration
  const mockData = useMemo(() => {
    const points: PnLPoint[] = [];
    const now = Date.now();
    let cumulativePnL = 0;
    const basePortfolio = 98.82;

    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      const pnl = (Math.random() - 0.48) * 2; // Slight negative bias for realism
      cumulativePnL += pnl;

      points.push({
        timestamp,
        pnl,
        cumulativePnL,
        portfolioValue: basePortfolio + cumulativePnL
      });
    }

    return points;
  }, [selectedTimeframe]);

  const chartData = data || mockData;

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!chartData.length) return null;

    const totalPnL = chartData[chartData.length - 1].cumulativePnL;
    const startValue = chartData[0].portfolioValue;
    const endValue = chartData[chartData.length - 1].portfolioValue;
    const percentChange = ((endValue - startValue) / startValue) * 100;

    const wins = chartData.filter(p => p.pnl > 0).length;
    const losses = chartData.filter(p => p.pnl < 0).length;
    const winRate = (wins / (wins + losses)) * 100;

    const maxPnL = Math.max(...chartData.map(p => p.pnl));
    const minPnL = Math.min(...chartData.map(p => p.pnl));
    const avgPnL = chartData.reduce((sum, p) => sum + p.pnl, 0) / chartData.length;

    return {
      totalPnL,
      percentChange,
      winRate,
      wins,
      losses,
      maxPnL,
      minPnL,
      avgPnL
    };
  }, [chartData]);

  const timeframes: ChartTimeframe[] = [
    { label: '1 Hour', value: '1h', duration: 60 * 60 * 1000 },
    { label: '4 Hours', value: '4h', duration: 4 * 60 * 60 * 1000 },
    { label: '1 Day', value: '1d', duration: 24 * 60 * 60 * 1000 },
    { label: '1 Week', value: '1w', duration: 7 * 24 * 60 * 60 * 1000 },
    { label: '1 Month', value: '1m', duration: 30 * 24 * 60 * 60 * 1000 }
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-aura-backgroundLight border-aura-accent/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-aura-accent" />
                Profit & Loss Analysis
              </CardTitle>
              <CardDescription>
                Performance metrics over {selectedTimeframe.label.toLowerCase()}
              </CardDescription>
            </div>

            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe.value === tf.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf)}
                  className="text-xs"
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Chart Placeholder */}
          <div className="h-64 bg-aura-background/50 rounded-lg border border-aura-accent/10 flex items-center justify-center mb-6">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-aura-accent/30 mx-auto mb-3" />
              <p className="text-sm text-aura-foreground/60">
                P&L Chart Visualization
              </p>
              <p className="text-xs text-aura-foreground/40 mt-1">
                Connect your preferred charting library (e.g., Recharts, Chart.js)
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-aura-background/50 rounded-lg">
                <p className="text-xs text-aura-foreground/60 mb-1">Total P&L</p>
                <p className={`text-lg font-bold ${statistics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {statistics.totalPnL >= 0 ? '+' : ''}${Math.abs(statistics.totalPnL).toFixed(2)}
                </p>
                <p className={`text-xs ${statistics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {statistics.percentChange >= 0 ? '+' : ''}{statistics.percentChange.toFixed(2)}%
                </p>
              </div>

              <div className="text-center p-3 bg-aura-background/50 rounded-lg">
                <p className="text-xs text-aura-foreground/60 mb-1">Win Rate</p>
                <p className="text-lg font-bold text-aura-foreground">
                  {statistics.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-aura-foreground/60">
                  {statistics.wins}W / {statistics.losses}L
                </p>
              </div>

              <div className="text-center p-3 bg-aura-background/50 rounded-lg">
                <p className="text-xs text-aura-foreground/60 mb-1">Best Trade</p>
                <p className="text-lg font-bold text-green-400">
                  +${statistics.maxPnL.toFixed(2)}
                </p>
                <p className="text-xs text-aura-foreground/60">
                  Single trade
                </p>
              </div>

              <div className="text-center p-3 bg-aura-background/50 rounded-lg">
                <p className="text-xs text-aura-foreground/60 mb-1">Worst Trade</p>
                <p className="text-lg font-bold text-red-400">
                  ${statistics.minPnL.toFixed(2)}
                </p>
                <p className="text-xs text-aura-foreground/60">
                  Single trade
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <Card className="bg-aura-backgroundLight border-aura-accent/10">
        <CardHeader>
          <CardTitle className="text-sm">Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => {
                const pnl = (Math.random() - 0.5) * 5;
                const isProfitable = pnl >= 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2 bg-aura-background/50 rounded-lg">
                    <span className="text-sm text-aura-foreground/60">
                      {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {isProfitable ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfitable ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-2">
              <div className="text-center text-sm text-aura-foreground/60 py-8">
                Weekly breakdown coming soon
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-2">
              <div className="text-center text-sm text-aura-foreground/60 py-8">
                Monthly breakdown coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PnLChart;