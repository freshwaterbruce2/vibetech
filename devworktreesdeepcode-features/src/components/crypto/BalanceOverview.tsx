import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  Lock,
  TrendingUp,
  DollarSign,
  Coins
} from 'lucide-react';
import { Balance } from '@/types/crypto-trading';

interface BalanceOverviewProps {
  balances: Balance[];
}

const BalanceOverview: React.FC<BalanceOverviewProps> = ({ balances }) => {
  // Calculate total portfolio value
  const totalValue = balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0);
  const totalAvailable = balances.reduce((sum, balance) => sum + balance.availableAmount * (balance.usdValue || balance.amount) / balance.amount, 0);
  const totalLocked = balances.reduce((sum, balance) => sum + balance.lockedAmount * (balance.usdValue || balance.amount) / balance.amount, 0);

  // Get asset icon
  const getAssetIcon = (asset: string) => {
    switch (asset.toUpperCase()) {
      case 'USD':
        return <DollarSign className="h-4 w-4" />;
      case 'XLM':
      case 'BTC':
      case 'ETH':
        return <Coins className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  // Get asset color
  const getAssetColor = (asset: string) => {
    switch (asset.toUpperCase()) {
      case 'USD':
        return 'text-green-400';
      case 'XLM':
        return 'text-blue-400';
      case 'BTC':
        return 'text-orange-400';
      case 'ETH':
        return 'text-purple-400';
      default:
        return 'text-aura-accent';
    }
  };

  return (
    <div className="space-y-4">
      {/* Total Balance Card */}
      <Card className="bg-aura-backgroundLight border-aura-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-aura-accent" />
            Balance Overview
          </CardTitle>
          <CardDescription>
            Your current asset holdings and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Portfolio Value */}
          <div className="p-4 bg-aura-background/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aura-foreground/60">Total Portfolio Value</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-aura-foreground">
              ${totalValue.toFixed(2)}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-aura-foreground/60">
                  Available: ${totalAvailable.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-xs text-aura-foreground/60">
                  Locked: ${totalLocked.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="space-y-3">
            {balances.map((balance) => {
              const percentOfTotal = totalValue > 0 ? (balance.usdValue || 0) / totalValue * 100 : 0;
              const lockedPercent = balance.amount > 0 ? (balance.lockedAmount / balance.amount) * 100 : 0;

              return (
                <div
                  key={balance.asset}
                  className="p-3 bg-aura-background/30 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded bg-aura-background/50 ${getAssetColor(balance.asset)}`}>
                        {getAssetIcon(balance.asset)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-aura-foreground">
                            {balance.asset}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {percentOfTotal.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-aura-foreground/60">
                          {balance.amount.toFixed(4)} {balance.asset}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-aura-foreground">
                        ${(balance.usdValue || 0).toFixed(2)}
                      </p>
                      {balance.asset !== 'USD' && balance.amount > 0 && (
                        <p className="text-xs text-aura-foreground/60">
                          @ ${((balance.usdValue || 0) / balance.amount).toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Availability Bar */}
                  {balance.lockedAmount > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-aura-foreground/60">
                        <span>Available: {balance.availableAmount.toFixed(4)}</span>
                        <span>Locked: {balance.lockedAmount.toFixed(4)}</span>
                      </div>
                      <Progress
                        value={100 - lockedPercent}
                        className="h-1.5"
                        indicatorClassName="bg-green-400"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Allocation Chart */}
          <div className="space-y-2">
            <p className="text-xs text-aura-foreground/60">Portfolio Allocation</p>
            <div className="flex gap-1 h-6 rounded overflow-hidden">
              {balances.map((balance, _index) => {
                const percent = totalValue > 0 ? (balance.usdValue || 0) / totalValue * 100 : 0;
                if (percent === 0) return null;

                return (
                  <div
                    key={balance.asset}
                    className={`${
                      balance.asset === 'USD' ? 'bg-green-400' :
                      balance.asset === 'XLM' ? 'bg-blue-400' :
                      balance.asset === 'BTC' ? 'bg-orange-400' :
                      balance.asset === 'ETH' ? 'bg-purple-400' :
                      'bg-aura-accent'
                    } opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={{ width: `${percent}%` }}
                    title={`${balance.asset}: ${percent.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {balances.map((balance) => {
                const percent = totalValue > 0 ? (balance.usdValue || 0) / totalValue * 100 : 0;
                if (percent === 0) return null;

                return (
                  <div key={balance.asset} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded ${
                      balance.asset === 'USD' ? 'bg-green-400' :
                      balance.asset === 'XLM' ? 'bg-blue-400' :
                      balance.asset === 'BTC' ? 'bg-orange-400' :
                      balance.asset === 'ETH' ? 'bg-purple-400' :
                      'bg-aura-accent'
                    }`} />
                    <span className="text-aura-foreground/60">
                      {balance.asset}: {percent.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-aura-accent/10">
            <div className="text-center">
              <p className="text-xs text-aura-foreground/60 mb-1">Assets Held</p>
              <p className="text-lg font-bold text-aura-foreground">
                {balances.filter(b => b.amount > 0).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-aura-foreground/60 mb-1">In Orders</p>
              <p className="text-lg font-bold text-yellow-400">
                ${totalLocked.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Balance Warning */}
      {totalAvailable < 50 && (
        <Card className="bg-yellow-400/5 border-yellow-400/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <Lock className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Low Available Balance</p>
              <p className="text-xs text-aura-foreground/60">
                Your available balance is below recommended levels for active trading
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceOverview;