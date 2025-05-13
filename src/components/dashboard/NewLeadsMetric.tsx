
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from 'lucide-react';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';

export default function NewLeadsMetric() {
  const [newLeadsCount, setNewLeadsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewLeads = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate date for 24 hours ago
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        // Query leads created in the last 24 hours
        const { count, error } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo.toISOString());
        
        if (error) throw error;
        
        setNewLeadsCount(count || 0);
      } catch (err) {
        console.error('Error fetching new leads:', err);
        setError('Failed to load new leads data');
      } finally {
        setIsLoading(false);
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
      value={isLoading ? "..." : newLeadsCount}
      description={error ? "Failed to load data" : "from yesterday"}
      icon={Database}
      trend={newLeadsCount > 0 ? { value: `${newLeadsCount}`, positive: true } : undefined}
    />
  );
}
