
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
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Dashboard refreshed",
        description: "Latest data has been loaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh dashboard data",
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
      className="flex items-center gap-1 bg-aura-backgroundLight border-aura-accent/20 hover:bg-aura-accent/10"
    >
      <RefreshCcw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </Button>
  );
};

export default DashboardRefreshButton;
