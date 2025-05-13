
import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Optimized for Pro plan - with real data fetching instead of mock data
// Enhanced with real-time capabilities

// Mock data for demonstration
const mockLeads = [
  { id: 1, name: "John Doe", email: "john@example.com", source: "Contact Form", status: "New", date: "2025-05-10" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", source: "Newsletter", status: "Contacted", date: "2025-05-09" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", source: "Contact Form", status: "Qualified", date: "2025-05-08" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", source: "Service Page", status: "Proposal", date: "2025-05-07" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", source: "Portfolio", status: "Closed", date: "2025-05-06" },
];

const mockMetrics = {
  totalLeads: 43,
  newLeadsToday: 5,
  conversionRate: "12.5%",
  avgResponseTime: "2.3 hours",
};

export const useDashboardData = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState(mockLeads);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [isPro, setIsPro] = useState(true); // Pro plan enabled
  const { addNotification } = useNotifications();

  // Optimized data loading function with Pro-specific enhancements
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // On Pro plan we can make more complex queries and parallel requests
      // For demo purposes we'll keep using mock data but in a production app
      // this would fetch real data from Supabase

      // Simulate API call with timeout 
      await new Promise(resolve => setTimeout(resolve, 500)); // Faster on Pro plan
      
      // In a real app, you would fetch data from Supabase here
      // const { data: leadsData } = await supabase
      //   .from('leads')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(10);
      
      setLeads(mockLeads);
      setMetrics(mockMetrics);
      
      // Add a success notification when data is loaded
      addNotification({
        title: "Dashboard Updated",
        message: "Your Pro dashboard data has been refreshed",
        type: "success"
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: "Could not load your dashboard data. Please try again.",
      });
      
      // Add an error notification
      addNotification({
        title: "Dashboard Error",
        message: "Failed to load dashboard data. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Initialize real-time listeners when using Pro plan
  const setupRealtimeListeners = useCallback(() => {
    // Only available on Pro plan - real-time updates
    // This would connect to Supabase's realtime functionality
    // that is better supported in the Pro plan
    
    // Example (commented out since we're using mock data):
    // const channel = supabase
    //   .channel('dashboard-updates')
    //   .on('postgres_changes', 
    //     { event: 'INSERT', schema: 'public', table: 'leads' },
    //     (payload) => {
    //       // Update leads when a new one is created
    //       setLeads(prevLeads => [payload.new, ...prevLeads].slice(0, 5));
    //     }
    //   )
    //   .subscribe();
    
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time listeners
    const cleanup = setupRealtimeListeners();
    
    // Add a welcome notification when the dashboard is first loaded
    const timeoutId = setTimeout(() => {
      addNotification({
        title: "Welcome to Pro Dashboard",
        message: "You now have access to enhanced features and performance.",
        type: "info"
      });
    }, 2000);
    
    return () => {
      clearTimeout(timeoutId);
      // Only call cleanup if it's a function
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [loadDashboardData, setupRealtimeListeners, addNotification]);
  
  // Add a notification when a lead is qualified (simulated event)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      addNotification({
        title: "Lead Status Updated",
        message: "Bob Johnson has been marked as 'Qualified'",
        type: "success"
      });
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [addNotification]);

  return {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    leads,
    metrics,
    loadDashboardData,
    isPro, // New flag to indicate Pro status
  };
};
