
import { Database } from 'lucide-react';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';

const NewLeadsMetric = () => {
  // Use a simple hardcoded value instead of state
  const newLeadsCount = 5;

  return (
    <DashboardMetricCard 
      title="New Leads (24h)"
      value={newLeadsCount}
      description="from yesterday"
      icon={Database}
      trend={{ value: `${newLeadsCount}`, positive: true }}
    />
  );
};

export default NewLeadsMetric;
