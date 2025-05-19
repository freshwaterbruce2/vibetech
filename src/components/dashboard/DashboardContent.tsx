
import { motion } from "framer-motion";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import TodoList from "@/components/TodoList";
import NewLeadsMetric from "@/components/dashboard/NewLeadsMetric";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";

interface Lead {
  id: number;
  name: string;
  email: string;
  source: string;
  status: string;
  date: string;
}

interface DashboardContentProps {
  leads: Lead[];
  metrics: {
    totalLeads: number;
    newLeadsToday: number;
    conversionRate: string;
    avgResponseTime: string;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDeleteLead?: (id: number) => void;
  isPro?: boolean; // Optional prop for Pro status
}

const DashboardContent = ({ 
  leads, 
  metrics, 
  activeTab, 
  setActiveTab, 
  onDeleteLead,
  isPro = false 
}: DashboardContentProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Include the new real-time leads metric */}
          <NewLeadsMetric />
          
          {/* Keep the other mock metrics */}
          <DashboardMetrics metrics={metrics} />
        </div>
        
        {/* Pro plan indicator - subtle but visible */}
        {isPro && (
          <div className="mb-4 text-right">
            <span className="bg-aura-neonBlue/10 text-aura-neonBlue text-xs px-2 py-1 rounded-full border border-aura-neonBlue/20">
              Pro Plan Active
            </span>
          </div>
        )}
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
            onDeleteLead={onDeleteLead}
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
  );
};

export default DashboardContent;
