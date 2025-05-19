
import { useEffect } from "react";
import { useNotifications } from "@/context/NotificationsContext";

export const useNotificationEffects = (
  isInitialLoadRef: React.MutableRefObject<boolean>,
  dataLoadedRef: React.MutableRefObject<boolean>,
  loadDashboardData: () => Promise<void>
) => {
  const { addNotification } = useNotifications();
  
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
  }, [loadDashboardData, addNotification, isInitialLoadRef, dataLoadedRef]);
  
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
  }, [addNotification, dataLoadedRef, isInitialLoadRef]);
};
