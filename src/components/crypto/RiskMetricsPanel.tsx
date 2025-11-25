import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  Percent,
  DollarSign,
  BarChart3,
  Activity,
  Info
} from 'lucide-react';
import { RiskMetrics } from '@/types/crypto-trading';

interface RiskMetricsPanelProps {
  metrics: RiskMetrics;
}

const RiskMetricsPanel: React.FC<RiskMetricsPanelProps> = ({ metrics }) => {
  // Calculate risk levels and colors
  const getRiskLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score < 0.3) return { label: 'Low', color: 'text-green-400', bgColor: 'bg-green-400/10' };
    if (score < 0.6) return { label: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
    if (score < 0.8) return { label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-400/10' };
    return { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-400/10' };
  };

  const riskLevel = getRiskLevel(metrics.riskScore);
  const exposurePercent = (metrics.totalExposure / metrics.portfolioValue) * 100;
  const marginUtilization = metrics.marginAvailable > 0
    ? (metrics.marginUsed / (metrics.marginUsed + metrics.marginAvailable)) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Overall Risk Assessment */}
      <Card className="bg-aura-backgroundLight border-aura-accent/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-aura-accent" />
              <CardTitle>Risk Assessment</CardTitle>
            </div>
            <Badge className={`${riskLevel.bgColor} ${riskLevel.color} border-0`}>
              {riskLevel.label} Risk
            </Badge>
          </div>
          <CardDescription>
            Comprehensive analysis of your trading risk exposure
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Risk Score Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-aura-foreground/60">Overall Risk Score</span>
              <span className={`font-bold ${riskLevel.color}`}>
                {(metrics.riskScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress
              value={metrics.riskScore * 100}
              className="h-3"
              indicatorClassName={
                metrics.riskScore < 0.3 ? 'bg-green-400' :
                metrics.riskScore < 0.6 ? 'bg-yellow-400' :
                metrics.riskScore < 0.8 ? 'bg-orange-400' : 'bg-red-400'
              }
            />
            <div className="flex justify-between text-xs text-aura-foreground/40">
              <span>Safe</span>
              <span>Max: {(metrics.maxRiskScore * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Risk Warnings */}
          {metrics.riskScore > 0.6 && (
            <Alert className="border-yellow-400/20 bg-yellow-400/5">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription>
                Your risk exposure is {metrics.riskScore > 0.8 ? 'critically' : ''} elevated.
                Consider reducing position sizes or implementing tighter stop losses.
              </AlertDescription>
            </Alert>
          )}

          {/* Key Risk Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-aura-foreground/60" />
                <span className="text-xs text-aura-foreground/60">Total Exposure</span>
              </div>
              <p className="text-xl font-bold text-aura-foreground">
                ${metrics.totalExposure.toFixed(2)}
              </p>
              <p className="text-xs text-aura-foreground/60">
                {exposurePercent.toFixed(1)}% of portfolio
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-aura-foreground/60" />
                <span className="text-xs text-aura-foreground/60">Position Utilization</span>
              </div>
              <p className="text-xl font-bold text-aura-foreground">
                {metrics.positionCount}/{metrics.maxPositions}
              </p>
              <p className="text-xs text-aura-foreground/60">
                {((metrics.positionCount / metrics.maxPositions) * 100).toFixed(0)}% utilized
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3 text-aura-foreground/60" />
                <span className="text-xs text-aura-foreground/60">Margin Used</span>
              </div>
              <p className="text-xl font-bold text-aura-foreground">
                ${metrics.marginUsed.toFixed(2)}
              </p>
              <p className="text-xs text-aura-foreground/60">
                {marginUtilization.toFixed(1)}% of available
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-aura-foreground/60" />
                <span className="text-xs text-aura-foreground/60">Available Balance</span>
              </div>
              <p className="text-xl font-bold text-aura-foreground">
                ${metrics.availableBalance.toFixed(2)}
              </p>
              <p className="text-xs text-aura-foreground/60">
                For new positions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exposure Breakdown */}
      <Card className="bg-aura-backgroundLight border-aura-accent/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-aura-accent" />
            Exposure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exposure vs Max Exposure */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-aura-foreground/60">Current vs Maximum</span>
              <span className="text-aura-foreground">
                ${metrics.totalExposure.toFixed(2)} / ${metrics.maxExposure.toFixed(2)}
              </span>
            </div>
            <Progress
              value={(metrics.totalExposure / metrics.maxExposure) * 100}
              className="h-2"
              indicatorClassName={
                metrics.totalExposure / metrics.maxExposure < 0.5 ? 'bg-green-400' :
                metrics.totalExposure / metrics.maxExposure < 0.8 ? 'bg-yellow-400' : 'bg-red-400'
              }
            />
          </div>

          {/* Portfolio Allocation */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-aura-foreground/60">Portfolio Allocation</span>
              <span className="text-aura-foreground">
                {exposurePercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex gap-1 h-8">
              <div
                className="bg-aura-accent/60 rounded-l"
                style={{ width: `${exposurePercent}%` }}
              />
              <div
                className="bg-aura-background/50 rounded-r border border-aura-accent/10"
                style={{ width: `${100 - exposurePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-aura-foreground/40">
              <span>Exposed</span>
              <span>Available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management Tips */}
      <Card className="bg-aura-backgroundLight border-aura-accent/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-aura-accent" />
            Risk Management Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-1.5" />
              <div>
                <p className="text-sm text-aura-foreground">Position Sizing</p>
                <p className="text-xs text-aura-foreground/60">
                  Never risk more than 2% of your portfolio on a single trade
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-1.5" />
              <div>
                <p className="text-sm text-aura-foreground">Stop Loss Orders</p>
                <p className="text-xs text-aura-foreground/60">
                  Always set stop losses to limit potential downside
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-1.5" />
              <div>
                <p className="text-sm text-aura-foreground">Diversification</p>
                <p className="text-xs text-aura-foreground/60">
                  Spread risk across multiple positions and timeframes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-1.5" />
              <div>
                <p className="text-sm text-aura-foreground">Risk/Reward Ratio</p>
                <p className="text-xs text-aura-foreground/60">
                  Maintain a minimum 1:2 risk to reward ratio on all trades
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMetricsPanel;