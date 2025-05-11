
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
        animate={isLoaded ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants}>
          <DashboardHeader title="CRM Dashboard" />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <DashboardMetrics metrics={mockMetrics} />
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="relative"
        >
          <DashboardTabs 
            leads={mockLeads} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          {/* Tech decorative corner effects */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-aura-neonBlue/50"></div>
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-aura-neonBlue/50"></div>
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-aura-neonBlue/50"></div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-aura-neonBlue/50"></div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
