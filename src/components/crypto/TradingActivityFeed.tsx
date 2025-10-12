import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { TradingActivity } from '@/types/crypto-trading';

interface TradingActivityFeedProps {
  activities?: TradingActivity[];
  maxItems?: number;
}

const TradingActivityFeed: React.FC<TradingActivityFeedProps> = ({
  activities = [],
  maxItems = 50
}) => {
  const [filter, setFilter] = useState<'all' | 'order' | 'trade' | 'position' | 'event'>('all');

  // Generate mock activities if none provided
  const mockActivities: TradingActivity[] = activities.length > 0 ? activities : [
    {
      id: '1',
      type: 'order',
      title: 'Limit Order Placed',
      description: 'Buy 30 XLM @ $0.3850',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'success',
      value: '$11.55',
      pair: 'XLM/USD',
      side: 'buy',
      amount: 30
    },
    {
      id: '2',
      type: 'trade',
      title: 'Order Executed',
      description: 'Sold 25 XLM @ $0.3900',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'success',
      value: '$9.75',
      pair: 'XLM/USD',
      side: 'sell',
      amount: 25
    },
    {
      id: '3',
      type: 'position',
      title: 'Position Closed',
      description: 'Closed long position on XLM/USD',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'info',
      value: '+$0.45',
      pair: 'XLM/USD'
    },
    {
      id: '4',
      type: 'event',
      title: 'Risk Alert',
      description: 'Risk score approaching maximum threshold',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      status: 'warning'
    },
    {
      id: '5',
      type: 'order',
      title: 'Stop Loss Triggered',
      description: 'Stop loss executed for XLM position',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status: 'error',
      value: '-$2.10',
      pair: 'XLM/USD',
      side: 'sell'
    }
  ];

  // Filter activities
  const filteredActivities = filter === 'all'
    ? mockActivities
    : mockActivities.filter(a => a.type === filter);

  // Get icon for activity type
  const getActivityIcon = (activity: TradingActivity) => {
    switch (activity.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-aura-accent" />;
    }
  };

  // Get side icon
  const getSideIcon = (side?: 'buy' | 'sell') => {
    if (side === 'buy') return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (side === 'sell') return <TrendingDown className="h-3 w-3 text-red-400" />;
    return null;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-aura-backgroundLight border-aura-accent/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-aura-accent" />
              Trading Activity
            </CardTitle>
            <CardDescription>
              Real-time feed of your trading activities
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filter === 'all' ? 'All Activity' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('order')}>
                Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('trade')}>
                Trades
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('position')}>
                Positions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('event')}>
                Events
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.slice(0, maxItems).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-aura-background/50 transition-colors"
                >
                  <div className="mt-0.5">
                    {getActivityIcon(activity)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-aura-foreground">
                        {activity.title}
                      </p>
                      {activity.side && getSideIcon(activity.side)}
                      {activity.pair && (
                        <Badge variant="outline" className="text-xs">
                          {activity.pair}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-aura-foreground/60">
                      {activity.description}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-aura-foreground/40">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>

                      {activity.value && (
                        <span className={`text-xs font-medium ${
                          activity.value.startsWith('+') ? 'text-green-400' :
                          activity.value.startsWith('-') ? 'text-red-400' :
                          'text-aura-foreground'
                        }`}>
                          {activity.value}
                        </span>
                      )}

                      {activity.amount && (
                        <span className="text-xs text-aura-foreground/60">
                          {activity.amount} units
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-aura-accent/30 mx-auto mb-3" />
                <p className="text-sm text-aura-foreground/60">
                  No {filter === 'all' ? '' : filter} activities to display
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TradingActivityFeed;