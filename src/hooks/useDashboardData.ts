
import { useState, useEffect } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import { toast } from "@/hooks/use-toast";

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
  const { addNotification } = useNotifications();

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, you would fetch data from an API
      setLeads(mockLeads);
      setMetrics(mockMetrics);
      
      // Add a success notification when data is loaded
      addNotification({
        title: "Dashboard Updated",
        message: "Your dashboard data has been refreshed",
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
  };

  useEffect(() => {
    loadDashboardData();
    
    // Add a welcome notification when the dashboard is first loaded
    const timeoutId = setTimeout(() => {
      addNotification({
        title: "Welcome Back",
        message: "You have 3 tasks due today. Check your todo list.",
        type: "info"
      });
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
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
  }, []);

  return {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    leads,
    metrics,
    loadDashboardData,
  };
};
