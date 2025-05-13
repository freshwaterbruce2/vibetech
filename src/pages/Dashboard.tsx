
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";
import DashboardRefreshButton from "@/components/dashboard/DashboardRefreshButton";
import NotificationBadge from "@/components/dashboard/NotificationBadge";
import TodoList from "@/components/TodoList";
import { Skeleton } from "@/components/ui/skeleton";
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState(mockLeads);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [notificationCount, setNotificationCount] = useState(3);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, you would fetch data from an API
      setLeads(mockLeads);
      setMetrics(mockMetrics);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: "Could not load your dashboard data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: `You have ${notificationCount} unread notifications`,
    });
    setNotificationCount(0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-aura-darkBg circuit-bg pb-16 relative overflow-hidden">
      {/* Background effects */}
      <MeshAuroraBackground intensity="low" />
      <ParticleNetworkCanvas particleCount={12} opacity={0.08} />
      
      <NavBar />
      
      <motion.div 
        className="max-w-7xl mx-auto px-4 pt-28 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <DashboardHeader title="CRM Dashboard" />
          
          <div className="flex items-center gap-4">
            <NotificationBadge count={notificationCount} onClick={handleNotificationClick} />
            <DashboardRefreshButton onRefresh={loadDashboardData} />
          </div>
        </motion.div>
        
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 bg-aura-backgroundLight/50" />
              ))}
            </div>
            <Skeleton className="h-96 bg-aura-backgroundLight/50" />
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center"
          >
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-aura-accent rounded-md hover:bg-aura-accent/90"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <DashboardMetrics metrics={metrics} />
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <motion.div 
                variants={itemVariants}
                className="relative lg:col-span-2"
              >
                <DashboardTabs 
                  leads={leads} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                />
                
                {/* Tech decorative corner effects */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-aura-neonBlue/50"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-aura-neonBlue/50"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-aura-neonBlue/50"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-aura-neonBlue/50"></div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <TodoList />
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
