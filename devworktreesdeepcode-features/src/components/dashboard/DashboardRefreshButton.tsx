
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

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
      // Toast handling is now fully managed in the useDashboardData hook
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
