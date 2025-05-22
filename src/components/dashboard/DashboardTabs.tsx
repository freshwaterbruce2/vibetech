
import { useState } from "react";
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
    <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="mb-8">
      <TabsList className="grid grid-cols-4 mb-6 bg-aura-darkBgLight border border-white/10">        
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Overview
        </TabsTrigger>
        
        <TabsTrigger value="leads" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Leads
        </TabsTrigger>
        
        <TabsTrigger value="messages" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages
        </TabsTrigger>
        
        <TabsTrigger value="calendar" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Calendar
        </TabsTrigger>
      </TabsList>
      
      <div className="relative">
        <TabsContent value="overview" className="mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DashboardOverview recentLeads={leads} />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="leads" className="mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DashboardLeads leads={leads} onDeleteLead={onDeleteLead} />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="messages" className="mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
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
