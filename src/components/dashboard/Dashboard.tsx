import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardHeader } from './DashboardHeader';
import { useAnalytics } from '@/hooks/useAnalytics';

interface DashboardMetrics {
  totalRevenue: number;
  activeUsers: number;
  conversionRate: number;
  monthlyGrowth: number;
}

interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'revenue' | 'user' | 'conversion' | 'alert';
  value?: string;
}

interface DashboardProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function Dashboard({
  title = "Analytics Dashboard",
  subtitle = "Monitor your business metrics and performance",
  showHeader = true,
  refreshInterval = 30000, // 30 seconds
  className = ""
}: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    activeUsers: 0,
    conversionRate: 0,
    monthlyGrowth: 0
  });

  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { trackButtonClick } = useAnalytics();

  // Simulate data fetching
  const fetchDashboardData = async () => {
    setIsRefreshing(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data generation
    setMetrics({
      totalRevenue: Math.floor(Math.random() * 100000) + 50000,
      activeUsers: Math.floor(Math.random() * 5000) + 1000,
      conversionRate: Math.random() * 10 + 2,
      monthlyGrowth: Math.random() * 20 + 5
    });

    setRecentActivity([
      {
        id: '1',
        title: 'New user registration',
        description: 'User signed up for premium plan',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: 'user',
        value: '+1'
      },
      {
        id: '2',
        title: 'Revenue milestone',
        description: 'Monthly revenue target achieved',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        type: 'revenue',
        value: '$50,000'
      },
      {
        id: '3',
        title: 'Conversion improvement',
        description: 'Landing page conversion increased',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'conversion',
        value: '+2.3%'
      }
    ]);

    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleRefresh = () => {
    trackButtonClick('dashboard_refresh', 'analytics_dashboard');
    fetchDashboardData();
  };

  const handleExport = () => {
    trackButtonClick('dashboard_export', 'analytics_dashboard');
    // Implement export functionality
    // Export logic would go here
  };

  // Auto-refresh data
  useEffect(() => {
    fetchDashboardData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const getActivityIcon = (type: DashboardActivity['type']) => {
    switch (type) {
      case 'revenue':
        return DollarSign;
      case 'user':
        return Users;
      case 'conversion':
        return TrendingUp;
      case 'alert':
        return Activity;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: DashboardActivity['type']) => {
    switch (type) {
      case 'revenue':
        return 'text-aura-neonBlue';
      case 'user':
        return 'text-aura-neonPurple';
      case 'conversion':
        return 'text-green-400';
      case 'alert':
        return 'text-yellow-400';
      default:
        return 'text-aura-accent';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen bg-aura-background text-aura-foreground p-6 ${className}`}
    >
      {showHeader && (
        <motion.div variants={itemVariants}>
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            actions={
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-aura-accent/20 hover:border-aura-accent/40"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="border-aura-accent/20 hover:border-aura-accent/40"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            }
          />
        </motion.div>
      )}

      {/* Metrics Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <DashboardMetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          description="Total revenue this month"
          icon={DollarSign}
          trend={{
            value: "+12.5%",
            positive: true
          }}
        />
        <DashboardMetricCard
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          description="Users active in the last 30 days"
          icon={Users}
          trend={{
            value: "+8.2%",
            positive: true
          }}
        />
        <DashboardMetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          description="Visitors converted to customers"
          icon={TrendingUp}
          trend={{
            value: "+0.5%",
            positive: true
          }}
        />
        <DashboardMetricCard
          title="Monthly Growth"
          value={`${metrics.monthlyGrowth.toFixed(1)}%`}
          description="Growth compared to last month"
          icon={BarChart3}
          trend={{
            value: "+3.1%",
            positive: true
          }}
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-aura-accent" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Detailed analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-aura-accent/10 rounded-lg bg-aura-background/50">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-aura-accent/50 mx-auto mb-3" />
                  <p className="text-sm text-aura-foreground/60">
                    Chart visualization would be rendered here
                  </p>
                  <p className="text-xs text-aura-foreground/40 mt-1">
                    Connect your preferred charting library
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Recent Activity */}
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-aura-accent" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest business activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-aura-background/50 border border-aura-accent/5"
                    >
                      <div className={`p-2 rounded-lg bg-aura-background border border-aura-accent/10`}>
                        <Icon className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-aura-foreground">
                          {activity.title}
                        </p>
                        <p className="text-xs text-aura-foreground/60 mb-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-aura-foreground/40">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                          {activity.value && (
                            <Badge
                              variant="outline"
                              className="text-xs border-aura-accent/20 text-aura-accent"
                            >
                              {activity.value}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader>
              <CardTitle className="text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-aura-foreground/60">Last Updated</span>
                  <span className="text-xs text-aura-foreground/80">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-aura-foreground/60">Status</span>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-aura-foreground/60">Auto Refresh</span>
                  <Badge variant="outline" className="border-aura-accent/20 text-aura-accent">
                    {refreshInterval > 0 ? `${refreshInterval / 1000}s` : 'Off'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}