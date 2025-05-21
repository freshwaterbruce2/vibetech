import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Calendar, MessageSquare, Users } from "lucide-react";
import DashboardOverview from "./DashboardOverview";
import DashboardLeads from "./DashboardLeads";
import DashboardEmptyState from "./DashboardEmptyState";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Lead {
  id: number;
  name: string;
  email: string;
  source: string;
  status: string;
  date: string;
}

interface DashboardTabsProps {
  leads: Lead[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDeleteLead?: (id: number) => void;
}

const DashboardTabs = ({ leads, activeTab, setActiveTab, onDeleteLead }: DashboardTabsProps) => {
  const { trackDashboardTabChange } = useAnalytics();
  
  // Track tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackDashboardTabChange(value);
  };

  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="mb-10">
      <TabsList className="grid grid-cols-4 mb-8 bg-aura-darkBgLight border border-aura-neonBlue/20 relative overflow-hidden">
        <span className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-aura-neonBlue to-aura-neonPurple w-full"></span>
        
        <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-b data-[state=active]:from-aura-neonBlue/10 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-aura-neonBlue transition-all duration-300">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </motion.div>
        </TabsTrigger>
        
        <TabsTrigger value="leads" className="data-[state=active]:bg-gradient-to-b data-[state=active]:from-aura-neonBlue/10 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-aura-neonBlue transition-all duration-300">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Users className="h-4 w-4 mr-2" />
            Leads
          </motion.div>
        </TabsTrigger>
        
        <TabsTrigger value="messages" className="data-[state=active]:bg-gradient-to-b data-[state=active]:from-aura-neonBlue/10 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-aura-neonBlue transition-all duration-300">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </motion.div>
        </TabsTrigger>
        
        <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-b data-[state=active]:from-aura-neonBlue/10 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-aura-neonBlue transition-all duration-300">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </motion.div>
        </TabsTrigger>
      </TabsList>
      
      <div className="relative">
        <TabsContent value="overview" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardOverview recentLeads={leads} />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="leads" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardLeads leads={leads} onDeleteLead={onDeleteLead} />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="messages" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardEmptyState 
              icon={MessageSquare}
              title="Customer Messages"
              description="When you receive messages, they'll appear here."
            />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardEmptyState 
              icon={Calendar}
              title="Upcoming Events"
              description="Add events to see them appear on your calendar."
            />
          </motion.div>
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default DashboardTabs;
