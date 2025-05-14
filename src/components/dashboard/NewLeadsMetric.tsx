
import { useState } from 'react';
import { Database } from 'lucide-react';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';

export default function NewLeadsMetric() {
  const [newLeadsCount] = useState<number>(5); // Default to 5 for immediate display

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
