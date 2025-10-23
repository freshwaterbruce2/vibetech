import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    ChevronRight,
    Clock,
    Cpu,
    Database,
    DollarSign,
    Globe,
    LineChart,
    PieChart,
    Server,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  suffix?: string;
}

const MetricCard = ({ title, value, change, icon, trend, suffix = '' }: MetricCardProps) => {
  const isPositive = trend === 'up';

  return (
    <Card className="relative overflow-hidden group hover:shadow-neon-blue transition-all duration-300 border-aura-accent/30 bg-gradient-to-br from-aura-darkBg/90 via-aura-darkBgLight/80 to-aura-darkBg/90 backdrop-blur-xl">
      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-aura-neonBlue/20 via-aura-neonPurple/20 to-aura-neonPink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />

      <div className="relative p-6">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-aura-neonBlue/20 to-aura-neonPurple/20 border border-aura-neonBlue/30 group-hover:shadow-neon-blue transition-all duration-300">
            <div className="text-aura-neonBlue group-hover:animate-pulse">
              {icon}
            </div>
          </div>

          <Badge
            variant="outline"
            className={`${
              isPositive
                ? 'bg-aura-neonGreen/10 border-aura-neonGreen/50 text-aura-neonGreen'
                : 'bg-red-500/10 border-red-500/50 text-red-400'
            } backdrop-blur-sm`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(change)}%
          </Badge>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-aura-textSecondary">
            {title}
          </h3>
          <p className="text-3xl font-bold text-white tracking-tight">
            {value}
            {suffix && <span className="text-xl text-aura-textSecondary ml-1">{suffix}</span>}
          </p>
        </div>

        {/* Sparkline placeholder */}
        <div className="mt-4 h-12 flex items-end gap-1">
          {[40, 60, 45, 70, 55, 85, 75, 90, 80, 95].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-aura-neonBlue/30 to-aura-neonPurple/30 rounded-t transition-all duration-300 group-hover:from-aura-neonBlue/50 group-hover:to-aura-neonPurple/50"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

interface ActivityItemProps {
  type: 'user' | 'system' | 'alert' | 'success';
  message: string;
  time: string;
  icon: React.ReactNode;
}

const ActivityItem = ({ type, message, time, icon }: ActivityItemProps) => {
  const typeColors = {
    user: 'from-aura-neonBlue/20 to-aura-neonBlue/10 border-aura-neonBlue/30',
    system: 'from-aura-neonPurple/20 to-aura-neonPurple/10 border-aura-neonPurple/30',
    alert: 'from-aura-neonOrange/20 to-aura-neonOrange/10 border-aura-neonOrange/30',
    success: 'from-aura-neonGreen/20 to-aura-neonGreen/10 border-aura-neonGreen/30',
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-aura-darkBgLight/50 border border-aura-accent/20 hover:border-aura-accent/40 transition-all duration-300 group cursor-pointer">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${typeColors[type]} border group-hover:shadow-neon transition-all duration-300`}>
        <div className="text-white w-5 h-5">
          {icon}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white group-hover:text-aura-neonBlue transition-colors duration-300">
          {message}
        </p>
        <p className="text-xs text-aura-textSecondary mt-1">
          {time}
        </p>
      </div>

      <ChevronRight className="w-5 h-5 text-aura-textSecondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

const VibeDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const metrics = [
    {
      title: 'Total Revenue',
      value: '$45,231',
      change: 12.5,
      trend: 'up' as const,
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      title: 'Active Users',
      value: '2,849',
      change: 8.2,
      trend: 'up' as const,
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: 'Conversion Rate',
      value: '3.24',
      change: -2.1,
      trend: 'down' as const,
      icon: <TrendingUp className="w-6 h-6" />,
      suffix: '%',
    },
    {
      title: 'Server Uptime',
      value: '99.9',
      change: 0.3,
      trend: 'up' as const,
      icon: <Server className="w-6 h-6" />,
      suffix: '%',
    },
  ];

  const systemMetrics = [
    { label: 'CPU Usage', value: 45, color: 'bg-aura-neonBlue' },
    { label: 'Memory', value: 72, color: 'bg-aura-neonPurple' },
    { label: 'Storage', value: 38, color: 'bg-aura-neonPink' },
    { label: 'Network', value: 61, color: 'bg-aura-neonGreen' },
  ];

  const recentActivity = [
    {
      type: 'user' as const,
      message: 'New user registration: johndoe@example.com',
      time: '2 minutes ago',
      icon: <Users className="w-full h-full" />,
    },
    {
      type: 'success' as const,
      message: 'Deployment completed successfully to production',
      time: '15 minutes ago',
      icon: <Sparkles className="w-full h-full" />,
    },
    {
      type: 'system' as const,
      message: 'Database backup completed - 2.4 GB',
      time: '1 hour ago',
      icon: <Database className="w-full h-full" />,
    },
    {
      type: 'alert' as const,
      message: 'High API response time detected (>500ms)',
      time: '2 hours ago',
      icon: <Activity className="w-full h-full" />,
    },
  ];

  return (
    <PageLayout
      title="Analytics Dashboard"
      description="Real-time insights and performance metrics for your platform"
    >
      <div className="min-h-screen py-12 relative">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-circuit-pattern opacity-5 animate-pulse-glow pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-aura-neonBlue via-aura-neonPurple to-aura-neonPink bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                  Vibe Dashboard
                </h1>
                <p className="text-aura-textSecondary">
                  Monitoring your platform's pulse
                </p>
              </div>

              <div className="flex items-center gap-2">
                {['24h', '7d', '30d', '90d'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={`${
                      timeRange === range
                        ? 'bg-gradient-to-r from-aura-neonBlue to-aura-neonPurple border-0 shadow-neon-blue'
                        : 'border-aura-accent/30 hover:border-aura-neonBlue/50 hover:shadow-neon-blue-soft'
                    } transition-all duration-300`}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="animate-slice-reveal"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <MetricCard {...metric} />
              </div>
            ))}
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Chart */}
            <Card className="lg:col-span-2 border-aura-accent/30 bg-gradient-to-br from-aura-darkBg/90 via-aura-darkBgLight/80 to-aura-darkBg/90 backdrop-blur-xl overflow-hidden group hover:shadow-neon-purple transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Revenue Overview
                    </h2>
                    <p className="text-sm text-aura-textSecondary">
                      Last 30 days performance
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-aura-neonBlue/20 hover:text-aura-neonBlue transition-colors">
                      <BarChart3 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-aura-neonPurple/20 hover:text-aura-neonPurple transition-colors">
                      <LineChart className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-aura-neonPink/20 hover:text-aura-neonPink transition-colors">
                      <PieChart className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div className="h-64 flex items-end justify-between gap-2">
                  {[45, 62, 55, 78, 65, 85, 72, 92, 88, 95, 90, 98, 94, 96, 93, 97, 95, 99, 96, 100].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-aura-neonBlue/40 via-aura-neonPurple/40 to-aura-neonPink/40 rounded-t hover:from-aura-neonBlue/60 hover:via-aura-neonPurple/60 hover:to-aura-neonPink/60 transition-all duration-300 cursor-pointer group-hover:shadow-neon"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-aura-accent/20">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-aura-neonBlue animate-pulse-glow" />
                      <span className="text-sm text-aura-textSecondary">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-aura-neonPurple animate-pulse-glow" />
                      <span className="text-sm text-aura-textSecondary">Profit</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="text-aura-neonBlue hover:bg-aura-neonBlue/20">
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* System Status */}
            <Card className="border-aura-accent/30 bg-gradient-to-br from-aura-darkBg/90 via-aura-darkBgLight/80 to-aura-darkBg/90 backdrop-blur-xl hover:shadow-neon-pink transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    System Status
                  </h2>
                  <Badge className="bg-aura-neonGreen/20 border-aura-neonGreen/50 text-aura-neonGreen">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    Online
                  </Badge>
                </div>

                <div className="space-y-6">
                  {systemMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-aura-textSecondary">{metric.label}</span>
                        <span className="font-semibold text-white">{metric.value}%</span>
                      </div>

                      <div className="relative h-2 bg-aura-darkBgLight rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${metric.color} rounded-full transition-all duration-1000 ease-out shadow-neon`}
                          style={{
                            width: `${metric.value}%`,
                            animationDelay: `${index * 150}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-aura-accent/20 grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-aura-darkBgLight/50 border border-aura-neonBlue/30 hover:border-aura-neonBlue/50 hover:shadow-neon-blue-soft transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="w-4 h-4 text-aura-neonBlue group-hover:animate-pulse" />
                      <span className="text-xs text-aura-textSecondary">Cores</span>
                    </div>
                    <p className="text-lg font-bold text-white">8</p>
                  </div>

                  <div className="p-3 rounded-lg bg-aura-darkBgLight/50 border border-aura-neonPurple/30 hover:border-aura-neonPurple/50 hover:shadow-neon-purple-soft transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-aura-neonPurple group-hover:animate-pulse" />
                      <span className="text-xs text-aura-textSecondary">Uptime</span>
                    </div>
                    <p className="text-lg font-bold text-white">99.9%</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Feed and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 border-aura-accent/30 bg-gradient-to-br from-aura-darkBg/90 via-aura-darkBgLight/80 to-aura-darkBg/90 backdrop-blur-xl hover:shadow-neon-teal transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Recent Activity
                  </h2>
                  <Button variant="ghost" size="sm" className="text-aura-neonBlue hover:bg-aura-neonBlue/20">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="animate-slice-reveal"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ActivityItem {...activity} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="border-aura-accent/30 bg-gradient-to-br from-aura-darkBg/90 via-aura-darkBgLight/80 to-aura-darkBg/90 backdrop-blur-xl hover:shadow-neon-green transition-all duration-300">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  Quick Actions
                </h2>

                <div className="space-y-3">
                  {[
                    { icon: <Zap />, label: 'Deploy to Production', color: 'neonBlue' },
                    { icon: <Database />, label: 'Backup Database', color: 'neonPurple' },
                    { icon: <Shield />, label: 'Security Scan', color: 'neonPink' },
                    { icon: <Globe />, label: 'Update DNS', color: 'neonGreen' },
                  ].map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start border-aura-accent/30 hover:border-aura-neonBlue/50 hover:bg-aura-neonBlue/10 hover:shadow-neon-blue-soft transition-all duration-300 group"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`mr-3 text-aura-${action.color} group-hover:animate-pulse`}>
                        {action.icon}
                      </div>
                      <span className="group-hover:text-aura-neonBlue transition-colors">
                        {action.label}
                      </span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-aura-accent/20">
                  <Button className="w-full bg-gradient-to-r from-aura-neonBlue via-aura-neonPurple to-aura-neonPink hover:shadow-neon-lg transition-all duration-300 border-0 group">
                    <Sparkles className="w-4 h-4 mr-2 group-hover:animate-spin" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default VibeDashboard;
