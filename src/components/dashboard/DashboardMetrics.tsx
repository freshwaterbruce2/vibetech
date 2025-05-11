
import { Database, User, PieChart, Activity } from "lucide-react";
import DashboardMetricCard from "./DashboardMetricCard";

interface DashboardMetricsProps {
  metrics: {
    totalLeads: number;
    newLeadsToday: number;
    conversionRate: string;
    avgResponseTime: string;
  };
}

const DashboardMetrics = ({ metrics }: DashboardMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardMetricCard 
        title="Total Leads"
        value={metrics.totalLeads}
        description="from last month"
        icon={Database}
        trend={{ value: "12.5%", positive: true }}
      />
      <DashboardMetricCard 
        title="New Leads Today"
        value={metrics.newLeadsToday}
        description="more than yesterday"
        icon={User}
        trend={{ value: "2", positive: true }}
      />
      <DashboardMetricCard 
        title="Conversion Rate"
        value={metrics.conversionRate}
        description="from last month"
        icon={PieChart}
        trend={{ value: "3.2%", positive: true }}
      />
      <DashboardMetricCard 
        title="Avg. Response Time"
        value={metrics.avgResponseTime}
        description="improvement"
        icon={Activity}
        trend={{ value: "0.5 hours", positive: false }}
      />
    </div>
  );
};

export default DashboardMetrics;
