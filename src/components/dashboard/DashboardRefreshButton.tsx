
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardRefreshButtonProps {
  onRefresh: () => void;
}

const DashboardRefreshButton = ({ onRefresh }: DashboardRefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      // Call onRefresh without handling toast here
      // Toast handling is done inside the useDashboardData hook
      await onRefresh();
    } catch (error) {
      console.error("Refresh error:", error);
      // Only show error toast if the error wasn't already handled in useDashboardData
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh dashboard data. Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="relative bg-aura-backgroundLight border-aura-neonBlue/30 hover:bg-aura-neonBlue/10"
    >
      <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );
};

export default DashboardRefreshButton;
