
import { Database } from 'lucide-react';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';

export default function NewLeadsMetric() {
  // Use a simple value instead of useState to avoid unnecessary re-renders
  const newLeadsCount = 5; // Default to 5 for immediate display

  return (
    <DashboardMetricCard 
      title="New Leads (24h)"
      value={newLeadsCount}
      description="from yesterday"
      icon={Database}
      trend={{ value: `${newLeadsCount}`, positive: true }}
    />
  );
}
