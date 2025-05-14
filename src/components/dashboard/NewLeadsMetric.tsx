
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
      setIsLoading(true);
      setError(null);
      
      try {
        // For demo purposes, we're using mock data
        // In a real app, you would fetch this from Supabase
        
        try {
          // Calculate date for 24 hours ago
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          // Query leads created in the last 24 hours - commented out for demo
          // const { count, error } = await supabase
          //   .from('leads')
          //   .select('id', { count: 'exact', head: true })
          //   .gte('created_at', oneDayAgo.toISOString());
          
          // if (error) throw error;
          
          // if (count !== null) {
          //   setNewLeadsCount(count);
          // }
          
          // Using mock data instead
          setNewLeadsCount(5);
        } catch (err) {
          console.error('Error fetching new leads:', err);
          // Don't set error state - we're already using fallback data
        }
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
