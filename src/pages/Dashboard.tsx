
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { Toaster } from "@/components/ui/toaster";

const Dashboard = () => {
  const {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    leads,
    metrics,
    loadDashboardData,
    deleteLead,
    addLead,
    isPro,
  } = useDashboardData();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-aura-darkBg circuit-bg pb-16 relative overflow-hidden">
      {/* Background effects with reduced intensity */}
      <DashboardBackground />
      
      <NavBar />
      
      <motion.div 
        className="max-w-7xl mx-auto px-4 pt-28 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
      >
        <DashboardTopbar 
          onRefresh={loadDashboardData} 
          isPro={isPro} 
          onAddLead={addLead}
        />
        
        <div className="mb-6 text-sm text-white">
          Welcome back, Bruce Freshwater
        </div>
        
        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <DashboardErrorState error={error} onRetry={loadDashboardData} />
        ) : (
          <DashboardContent 
            leads={leads} 
            metrics={metrics} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onDeleteLead={deleteLead}
            isPro={isPro} 
          />
        )}
      </motion.div>
      
      {/* Keep the Toaster component here to handle toast notifications */}
      <Toaster />
    </div>
  );
};

export default Dashboard;
