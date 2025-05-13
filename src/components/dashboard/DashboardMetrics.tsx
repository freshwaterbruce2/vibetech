
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
    <>
      <DashboardMetricCard 
        title="Total Leads"
        value={metrics.totalLeads}
        description="from last month"
        icon={Database}
        trend={{ value: "12.5%", positive: true }}
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
    </>
  );
};

export default DashboardMetrics;
