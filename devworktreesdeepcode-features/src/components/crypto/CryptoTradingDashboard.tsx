import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Shield,
  RefreshCw,
  Settings,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCryptoTradingDashboard } from '@/hooks/useCryptoTradingDashboard';
import PositionCard from './PositionCard';
import PnLChart from './PnLChart';
import RiskMetricsPanel from './RiskMetricsPanel';
import TradingActivityFeed from './TradingActivityFeed';
import BalanceOverview from './BalanceOverview';

interface CryptoTradingDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  compact?: boolean;
}

const CryptoTradingDashboard: React.FC<CryptoTradingDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 30000,
  compact = false
}) => {
  // Use custom hook for data fetching
  const {
    dashboardSummary,
    positions,
    riskMetrics,
    balances,
    recentActivity,
    connectionStatus,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
    clearError
  } = useCryptoTradingDashboard({ autoRefresh, refreshInterval });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!dashboardSummary) return null;

    const pnlColor = dashboardSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400';
    const pnlIcon = dashboardSummary.totalPnL >= 0 ? TrendingUp : TrendingDown;

    return {
      pnlColor,
      pnlIcon,
      formattedPnL: `${dashboardSummary.totalPnL >= 0 ? '+' : ''}$${Math.abs(dashboardSummary.totalPnL).toFixed(2)}`,
      formattedDailyPnL: `${dashboardSummary.dailyPnL >= 0 ? '+' : ''}$${Math.abs(dashboardSummary.dailyPnL).toFixed(2)}`
    };
  }, [dashboardSummary]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-aura-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-aura-accent animate-spin mx-auto mb-4" />
          <p className="text-aura-foreground/60">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-aura-background p-6">
        <Alert className="max-w-lg border-red-400/20 bg-red-400/5">
          <XCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-4 flex gap-2">
              <Button onClick={refresh} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`${compact ? 'p-4' : 'p-6'} space-y-6 bg-aura-background min-h-screen`}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-aura-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-aura-accent" />
            Crypto Trading Dashboard
          </h1>
          <p className="text-aura-foreground/60 mt-1">
            Real-time monitoring of your trading positions and performance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge
            variant={connectionStatus.connected ? "default" : "destructive"}
            className="px-3 py-1"
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus.connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            {connectionStatus.latency && ` (${connectionStatus.latency}ms)`}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
            className="border-aura-accent/20 hover:border-aura-accent/40"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-aura-accent/20 hover:border-aura-accent/40"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert className="border-yellow-400/20 bg-yellow-400/5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {error}
              <Button onClick={clearError} size="sm" variant="ghost" className="ml-2">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Key Metrics Cards */}
      {dashboardSummary && riskMetrics && summaryMetrics && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-aura-foreground/80">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-aura-foreground">
                ${dashboardSummary.totalPortfolioValue.toFixed(2)}
              </div>
              <p className="text-xs text-aura-foreground/60 mt-1">
                Available: ${dashboardSummary.availableBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-aura-foreground/80">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${summaryMetrics.pnlColor}`}>
                <summaryMetrics.pnlIcon className="h-5 w-5" />
                {summaryMetrics.formattedPnL}
              </div>
              <p className={`text-xs mt-1 ${summaryMetrics.pnlColor}`}>
                {dashboardSummary.totalPnLPercent >= 0 ? '+' : ''}{dashboardSummary.totalPnLPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-aura-foreground/80">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${riskMetrics.riskScore > 0.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {(riskMetrics.riskScore * 100).toFixed(0)}%
                </div>
                {riskMetrics.riskScore > 0.5 && (
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                )}
              </div>
              <p className="text-xs text-aura-foreground/60 mt-1">
                Max: {(riskMetrics.maxRiskScore * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-aura-foreground/80">Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-aura-foreground">
                {dashboardSummary.openPositions} / {riskMetrics.maxPositions}
              </div>
              <p className="text-xs text-aura-foreground/60 mt-1">
                Orders: {dashboardSummary.activeOrders}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Risk Alert */}
      {riskMetrics && riskMetrics.riskScore > 0.7 && (
        <motion.div variants={itemVariants}>
          <Alert className="border-yellow-400/20 bg-yellow-400/5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle>High Risk Warning</AlertTitle>
            <AlertDescription>
              Your current risk score ({(riskMetrics.riskScore * 100).toFixed(0)}%) exceeds recommended levels.
              Consider reducing position sizes or closing some positions.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {positions.length > 0 ? (
                  positions.map((position) => (
                    <PositionCard key={position.position.position_id} position={position} />
                  ))
                ) : (
                  <Card className="bg-aura-backgroundLight border-aura-accent/10">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Activity className="h-12 w-12 text-aura-accent/30 mb-4" />
                      <p className="text-aura-foreground/60 text-center">
                        No open positions
                      </p>
                      <p className="text-sm text-aura-foreground/40 mt-2">
                        Trading system is active and monitoring markets
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <BalanceOverview balances={balances} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PnLChart />
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            {riskMetrics && <RiskMetricsPanel metrics={riskMetrics} />}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <TradingActivityFeed activities={recentActivity} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Footer Status */}
      <motion.div variants={itemVariants} className="flex items-center justify-between text-xs text-aura-foreground/40">
        <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</span>
        <span>Auto-refresh: {autoRefresh ? `${refreshInterval / 1000}s` : 'Off'}</span>
      </motion.div>
    </motion.div>
  );
};

export default CryptoTradingDashboard;