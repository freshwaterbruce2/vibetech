
import { useState, useEffect, useCallback, useRef } from "react";
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
  // State declarations
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState(mockLeads);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [isPro, setIsPro] = useState(true);
  
  // External hooks
  const { addNotification } = useNotifications();
  
  // Refs for tracking state
  const isInitialLoadRef = useRef(true);
  const isManualRefreshRef = useRef(false);
  const dataLoadedRef = useRef(false);
  
  // Data loading function
  const loadDashboardData = useCallback(async () => {
    // Set manual refresh flag if it's not the initial load
    if (!isInitialLoadRef.current) {
      isManualRefreshRef.current = true;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLeads(mockLeads);
      setMetrics(mockMetrics);
      
      // Mark data as loaded
      dataLoadedRef.current = true;
      
      // Only show notifications if it's a manual refresh (not the initial load)
      if (!isInitialLoadRef.current && isManualRefreshRef.current) {
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
        
        // Reset manual refresh flag
        isManualRefreshRef.current = false;
      }
      
      isInitialLoadRef.current = false;
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      
      if (!isInitialLoadRef.current && isManualRefreshRef.current) {
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
        
        // Reset manual refresh flag
        isManualRefreshRef.current = false;
      }
      
      isInitialLoadRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);
  
  // Delete lead function
  const deleteLead = useCallback((leadId: number) => {
    try {
      // Filter out the lead with the given ID
      const updatedLeads = leads.filter(lead => lead.id !== leadId);
      setLeads(updatedLeads);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalLeads: prev.totalLeads - 1
      }));
      
      // Show success notification
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully removed.",
        variant: "success"
      });
      
      addNotification({
        title: "Lead Deleted",
        message: "Lead has been successfully removed from your dashboard.",
        type: "info"
      });
      
      return true;
    } catch (error) {
      console.error("Failed to delete lead:", error);
      
      // Show error notification
      toast({
        variant: "destructive",
        title: "Error deleting lead",
        description: "Could not delete the lead. Please try again."
      });
      
      return false;
    }
  }, [leads, addNotification]);
  
  // Initial data load effect - only run once
  useEffect(() => {
    if (!dataLoadedRef.current) {
      loadDashboardData();
    }
    
    // Setup simple logging for debugging
    console.log("Setting up realtime listeners");
    
    // Welcome notification
    if (isInitialLoadRef.current) {
      const timeoutId = setTimeout(() => {
        addNotification({
          title: "Welcome to Pro Dashboard",
          message: "You now have access to enhanced features and performance.",
          type: "info"
        });
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
        console.log("Cleaning up realtime listeners");
      };
    }
    
    return () => {
      console.log("Cleaning up realtime listeners");
    };
  }, [loadDashboardData, addNotification]);
  
  // Lead qualification notification effect 
  useEffect(() => {
    // Only show this notification after initial load is complete and data is loaded
    if (!isInitialLoadRef.current && dataLoadedRef.current) {
      const timeoutId = setTimeout(() => {
        addNotification({
          title: "Lead Status Updated",
          message: "Bob Johnson has been marked as 'Qualified'",
          type: "success"
        });
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [addNotification, dataLoadedRef.current]);

  return {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    leads,
    metrics,
    loadDashboardData,
    deleteLead,
    isPro,
  };
};
