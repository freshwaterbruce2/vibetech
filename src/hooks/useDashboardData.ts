
import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  // Add a ref to track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Optimized data loading function with Pro-specific enhancements
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with timeout 
      await new Promise(resolve => setTimeout(resolve, 500)); // Faster on Pro plan
      
      setLeads(mockLeads);
      setMetrics(mockMetrics);
      
      // Only show notifications if it's not the initial load
      if (!isInitialLoad) {
        // Add a success notification when data is loaded
        addNotification({
          title: "Dashboard Updated",
          message: "Your Pro dashboard data has been refreshed",
          type: "success"
        });

        // Add toast notification only on manual refresh
        toast({
          title: "Dashboard refreshed",
          description: "Your dashboard data has been updated successfully.",
        });
      }
      
      setIsInitialLoad(false);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      
      if (!isInitialLoad) {
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
      }
      
      setIsInitialLoad(false);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, isInitialLoad]);

  // Initialize real-time listeners when using Pro plan
  const setupRealtimeListeners = useCallback(() => {
    console.log("Setting up realtime listeners");
    
    // Return a cleanup function
    return () => {
      console.log("Cleaning up realtime listeners");
    };
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
      // Call cleanup function
      cleanup();
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
    isPro,
  };
};
