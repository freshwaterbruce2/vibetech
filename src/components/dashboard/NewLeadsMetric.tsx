
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from 'lucide-react';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import { toast } from '@/hooks/use-toast';

export default function NewLeadsMetric() {
  const [newLeadsCount, setNewLeadsCount] = useState<number>(5); // Default to 5 for immediate display
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewLeads = async () => {
      // Don't set loading to true since we're already using a default value
      setError(null);
      
      try {
        // Note: We're using mock data for now
        // In a real app, you would fetch this from Supabase
        setNewLeadsCount(5);
      } catch (err) {
        console.error('Error fetching new leads:', err);
        // We don't set error state since we have a fallback value
      }
    };
    
    fetchNewLeads();
    
    // Set up a polling interval to refresh the data every few minutes
    const intervalId = setInterval(fetchNewLeads, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
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
