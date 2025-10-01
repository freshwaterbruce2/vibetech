import { useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  Clock,
  Target,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: number;
  est_minutes?: number;
  status: string;
  labels?: string;
  created_at: string;
  updated_at: string;
}

interface FocusSession {
  id: string;
  task_id?: string;
  session_type: 'work' | 'short_break' | 'long_break';
  planned_minutes: number;
  actual_minutes: number;
  quality_rating?: number;
  notes?: string;
  started_at: string;
  completed_at?: string;
}

interface DailyStats {
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  averageRating: number;
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      return await invoke<Task[]>('get_tasks');
    },
  });

  const { data: focusSessions = [] } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: async () => {
      // This would be a backend call to get focus sessions
      // For now, return mock data
      const mockSessions: FocusSession[] = [];
      const now = new Date();

      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const sessionsPerDay = Math.floor(Math.random() * 6) + 1; // 1-6 sessions per day

        for (let j = 0; j < sessionsPerDay; j++) {
          mockSessions.push({
            id: `session-${i}-${j}`,
            session_type: 'work',
            planned_minutes: 25,
            actual_minutes: 25,
            quality_rating: Math.floor(Math.random() * 5) + 1,
            started_at: date.toISOString(),
            completed_at: date.toISOString(),
          });
        }
      }

      return mockSessions;
    },
  });

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const stats: DailyStats[] = [];
    const today = new Date();
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completedTasks = tasks.filter(
        (task) =>
          task.status === 'done' &&
          task.updated_at.startsWith(dateStr)
      ).length;

      const daysSessions = focusSessions.filter((session) =>
        session.started_at.startsWith(dateStr)
      );

      const focusMinutes = daysSessions.reduce(
        (total, session) => total + session.actual_minutes,
        0
      );

      const averageRating =
        daysSessions.length > 0
          ? daysSessions.reduce(
              (total, session) => total + (session.quality_rating || 0),
              0
            ) / daysSessions.length
          : 0;

      stats.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasksCompleted: completedTasks,
        focusMinutes,
        averageRating: Math.round(averageRating * 10) / 10,
      });
    }

    return stats;
  }, [tasks, focusSessions, timeRange]);

  // Task completion by status
  const tasksByStatus = useMemo(() => {
    const statusCounts = {
      today: tasks.filter((t) => t.status === 'today').length,
      doing: tasks.filter((t) => t.status === 'doing').length,
      done: tasks.filter((t) => t.status === 'done').length,
      backlog: tasks.filter((t) => t.status === 'backlog').length,
    };

    return [
      { name: 'Today', value: statusCounts.today, color: '#3b82f6' },
      { name: 'In Progress', value: statusCounts.doing, color: '#f59e0b' },
      { name: 'Completed', value: statusCounts.done, color: '#10b981' },
      { name: 'Backlog', value: statusCounts.backlog, color: '#6b7280' },
    ];
  }, [tasks]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const priorities = { low: 0, medium: 0, high: 0 };
    tasks.forEach((task) => {
      if (task.priority === 0) priorities.low++;
      else if (task.priority === 1) priorities.medium++;
      else priorities.high++;
    });

    return [
      { name: 'Low', value: priorities.low, color: '#10b981' },
      { name: 'Medium', value: priorities.medium, color: '#f59e0b' },
      { name: 'High', value: priorities.high, color: '#ef4444' },
    ];
  }, [tasks]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalFocusTime = focusSessions.reduce(
      (total, session) => total + session.actual_minutes,
      0
    );

    const averageSessionRating =
      focusSessions.length > 0
        ? focusSessions.reduce(
            (total, session) => total + (session.quality_rating || 0),
            0
          ) / focusSessions.length
        : 0;

    const todayStats = dailyStats[dailyStats.length - 1] || {
      tasksCompleted: 0,
      focusMinutes: 0,
      averageRating: 0,
    };

    return {
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
      totalFocusTime: Math.round(totalFocusTime / 60), // Convert to hours
      averageSessionRating: Math.round(averageSessionRating * 10) / 10,
      todayFocusTime: todayStats.focusMinutes,
      todayTasksCompleted: todayStats.tasksCompleted,
    };
  }, [tasks, focusSessions, dailyStats]);

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your productivity and focus patterns
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
            ].map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                onClick={() => setTimeRange(range.value as '7d' | '30d' | '90d')}
                size="sm"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {overallStats.completionRate}% completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalFocusTime}h</div>
              <p className="text-xs text-muted-foreground">
                {overallStats.todayFocusTime}m today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Quality</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.averageSessionRating}/5</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.todayTasksCompleted}</div>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tasks Completed Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Tasks Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="tasksCompleted"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Focus Time Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Focus Time (minutes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="focusMinutes"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Task Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tasksByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6">
                        {priorityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="space-y-4">
            {/* Session Quality Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Session Quality Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="averageRating"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Productivity Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Productivity Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Best day this week</span>
                    <span className="font-medium">
                      {dailyStats.length > 0 &&
                        dailyStats
                          .slice(-7)
                          .reduce((best, day) =>
                            day.tasksCompleted > best.tasksCompleted ? day : best
                          ).date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Longest focus session</span>
                    <span className="font-medium">
                      {Math.max(...focusSessions.map((s) => s.actual_minutes), 0)} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Most productive hour</span>
                    <span className="font-medium">10:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Weekly goal progress</span>
                    <span className="font-medium">75%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium text-green-600 mb-1">
                      Great job!
                    </div>
                    <div className="text-muted-foreground">
                      You've maintained consistent focus sessions this week.
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-blue-600 mb-1">
                      Suggestion
                    </div>
                    <div className="text-muted-foreground">
                      Try breaking down larger tasks into smaller ones for better completion rates.
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-purple-600 mb-1">
                      Focus tip
                    </div>
                    <div className="text-muted-foreground">
                      Your highest-rated sessions are in the morning. Schedule important work then.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}