
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
  isPro?: boolean;
}

const DashboardContent = ({ 
  leads, 
  metrics, 
  activeTab, 
  setActiveTab, 
  onDeleteLead,
  isPro: _isPro = false 
}: DashboardContentProps) => {
  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <NewLeadsMetric />
          <DashboardMetrics metrics={metrics} />
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2"
        >
          <DashboardTabs 
            leads={leads} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onDeleteLead={onDeleteLead}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <TodoList />
        </motion.div>
      </div>
    </>
  );
};

export default DashboardContent;
