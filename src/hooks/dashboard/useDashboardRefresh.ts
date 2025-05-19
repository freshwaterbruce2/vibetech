
import { useState, useCallback, useRef } from "react";
import { mockLeads, mockMetrics } from "./mockData";
import { useNotifications } from "@/context/NotificationsContext";
import { toast } from "@/hooks/use-toast";
import { Lead, DashboardMetrics } from "./types";

export const useDashboardRefresh = (
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>,
  setMetrics: React.Dispatch<React.SetStateAction<DashboardMetrics>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // Refs for tracking state
  const isInitialLoadRef = useRef(true);
  const isManualRefreshRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const { addNotification } = useNotifications();
  
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
  }, [addNotification, setError, setIsLoading, setLeads, setMetrics]);

  return { loadDashboardData, isInitialLoadRef, dataLoadedRef };
};
