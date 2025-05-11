
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Calendar, MessageSquare, Users } from "lucide-react";
import DashboardOverview from "./DashboardOverview";
import DashboardLeads from "./DashboardLeads";
import DashboardEmptyState from "./DashboardEmptyState";

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
}

const DashboardTabs = ({ leads, activeTab, setActiveTab }: DashboardTabsProps) => {
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-10">
      <TabsList className="grid grid-cols-4 mb-8 bg-aura-backgroundLight">
        <TabsTrigger value="overview">
          <BarChart className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="leads">
          <Users className="h-4 w-4 mr-2" />
          Leads
        </TabsTrigger>
        <TabsTrigger value="messages">
          <MessageSquare className="h-4 w-4 mr-2" />
          Messages
        </TabsTrigger>
        <TabsTrigger value="calendar">
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <DashboardOverview recentLeads={leads} />
      </TabsContent>
      
      <TabsContent value="leads">
        <DashboardLeads leads={leads} />
      </TabsContent>
      
      <TabsContent value="messages">
        <DashboardEmptyState 
          icon={MessageSquare}
          title="Customer Messages"
          description="When you receive messages, they'll appear here."
        />
      </TabsContent>
      
      <TabsContent value="calendar">
        <DashboardEmptyState 
          icon={Calendar}
          title="Upcoming Events"
          description="Add events to see them appear on your calendar."
        />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
