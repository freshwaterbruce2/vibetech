import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  StopCircle,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { PositionSummary } from '@/types/crypto-trading';

interface PositionCardProps {
  position: PositionSummary;
  onClose?: () => void;
  onUpdate?: () => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onClose, onUpdate }) => {
  const { position: pos, currentPrice, unrealizedPnL, unrealizedPnLPercent, riskAmount, durationHours } = position;

  // Calculate visual indicators
  const isProfitable = unrealizedPnL >= 0;
  const pnlColor = isProfitable ? 'text-green-400' : 'text-red-400';
  const pnlBgColor = isProfitable ? 'bg-green-400/10' : 'bg-red-400/10';
  const pnlBorderColor = isProfitable ? 'border-green-400/20' : 'border-red-400/20';
  const TrendIcon = isProfitable ? TrendingUp : TrendingDown;

  // Calculate progress to stop loss and take profit
  const priceRange = pos.take_profit && pos.stop_loss
    ? pos.take_profit - pos.stop_loss
    : 0;
  const currentProgress = priceRange > 0
    ? ((currentPrice - (pos.stop_loss || 0)) / priceRange) * 100
    : 50;

  // Format duration
  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`bg-aura-backgroundLight border-aura-accent/10 hover:border-aura-accent/20 transition-colors ${pnlBorderColor}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pnlBgColor}`}>
                <TrendIcon className={`h-5 w-5 ${pnlColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-aura-foreground">{pos.pair}</h3>
                  <Badge variant="outline" className="text-xs">
                    {pos.side.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-aura-foreground/60">
                    Entry: ${pos.entry_price.toFixed(4)}
                  </span>
                  <span className="text-xs text-aura-foreground/60">
                    Current: ${currentPrice.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onUpdate}>
                  Update Position
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClose} className="text-red-400">
                  Close Position
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* P&L Display */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-aura-foreground/60 mb-1">Unrealized P&L</p>
              <div className={`text-lg font-bold ${pnlColor}`}>
                {unrealizedPnL >= 0 ? '+' : ''}{`$${Math.abs(unrealizedPnL).toFixed(2)}`}
              </div>
              <p className={`text-xs ${pnlColor}`}>
                {unrealizedPnLPercent >= 0 ? '+' : ''}{unrealizedPnLPercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-aura-foreground/60 mb-1">Position Value</p>
              <div className="text-lg font-bold text-aura-foreground">
                ${(pos.volume * currentPrice).toFixed(2)}
              </div>
              <p className="text-xs text-aura-foreground/60">
                {pos.volume.toFixed(2)} units
              </p>
            </div>
          </div>

          {/* Stop Loss / Take Profit Progress */}
          {pos.stop_loss && pos.take_profit && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-aura-foreground/60">
                <span className="flex items-center gap-1">
                  <StopCircle className="h-3 w-3 text-red-400" />
                  SL: ${pos.stop_loss.toFixed(4)}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-green-400" />
                  TP: ${pos.take_profit.toFixed(4)}
                </span>
              </div>
              <Progress
                value={currentProgress}
                className="h-2"
                indicatorClassName={isProfitable ? 'bg-green-400' : 'bg-red-400'}
              />
            </div>
          )}

          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-aura-accent/10">
            <div className="text-center">
              <Clock className="h-3 w-3 text-aura-foreground/60 mx-auto mb-1" />
              <p className="text-xs text-aura-foreground/60">Duration</p>
              <p className="text-xs font-medium text-aura-foreground">
                {formatDuration(durationHours)}
              </p>
            </div>
            <div className="text-center">
              <DollarSign className="h-3 w-3 text-aura-foreground/60 mx-auto mb-1" />
              <p className="text-xs text-aura-foreground/60">Risk</p>
              <p className="text-xs font-medium text-aura-foreground">
                ${riskAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <Target className="h-3 w-3 text-aura-foreground/60 mx-auto mb-1" />
              <p className="text-xs text-aura-foreground/60">Status</p>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {pos.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PositionCard;