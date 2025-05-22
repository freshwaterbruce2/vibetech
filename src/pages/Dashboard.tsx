
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

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
  
  const { trackEvent } = useAnalytics();
  
  // Track dashboard page view with additional details
  useEffect(() => {
    trackEvent('dashboard_view', {
      category: 'Dashboard',
      label: isPro ? 'Pro Dashboard' : 'Standard Dashboard',
      customDimensions: {
        is_pro_user: isPro,
        active_tab: activeTab,
        lead_count: leads.length,
        has_error: error !== null
      }
    });
  }, [isPro, activeTab, leads.length, error, trackEvent]);

  // Simplified animation variant
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="min-h-screen bg-aura-darkBg pb-16 relative overflow-hidden">
      {/* Background effects with further reduced intensity */}
      <DashboardBackground />
      
      <NavBar />
      
      <motion.div 
        className="max-w-7xl mx-auto px-4 pt-24 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
      >
        <DashboardTopbar 
          onRefresh={loadDashboardData} 
          isPro={isPro} 
          onAddLead={addLead}
        />
        
        <div className="mb-4 text-sm text-gray-300">
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
