
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
      await onRefresh();
      // Remove the toast from here as it's already being called in the onRefresh function
    } catch (error) {
      console.error("Refresh error:", error);
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
