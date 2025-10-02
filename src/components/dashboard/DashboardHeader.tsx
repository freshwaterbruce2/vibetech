
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import AddLeadDialog from "@/components/lead/AddLeadDialog";
import { useAnalytics } from "@/hooks/useAnalytics";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
  onAddLead?: (lead: {
    name: string;
    email: string;
    source: string;
    status: string;
    date: string;
  }) => void;
}

const DashboardHeader = ({ title, subtitle, className = "", actions, onAddLead }: DashboardHeaderProps) => {
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const { trackButtonClick, trackEvent } = useAnalytics();

  const handleOpenAddLeadDialog = () => {
    setIsAddLeadDialogOpen(true);
    trackButtonClick('New Lead', 'Dashboard Header');
    trackEvent('dashboard_action', {
      category: 'Dashboard',
      label: 'Open Add Lead Form',
      customDimensions: { action_type: 'new_lead_form_open' }
    });
  };

  const handleAddLead = (leadData: {
    name: string;
    email: string;
    source: string;
    status: string;
    date: string;
  }) => {
    if (onAddLead) {
      onAddLead(leadData);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${className}`}>
      <div className="flex-grow">
        <PageHeader
          title={title}
          align="left"
          size="lg"
          glowColor="gradient"
          className="mb-0"
        />
        {subtitle && (
          <p className="text-aura-foreground/60 mt-2">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-3 md:ml-auto">
        {actions}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button
            className="bg-gradient-to-r from-[color:var(--c-cyan)] to-[color:var(--c-purple)] relative group hover:shadow-neon-blue transition-all duration-300 flex items-center gap-2 overflow-hidden"
            onClick={handleOpenAddLeadDialog}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[color:var(--c-cyan)/10] to-[color:var(--c-purple)/10] group-hover:opacity-80 transition-opacity"></span>
            <PlusCircle className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">New Lead</span>
          </Button>
        </motion.div>
      </div>
      
      {/* Add Lead Dialog */}
      <AddLeadDialog 
        isOpen={isAddLeadDialogOpen}
        onClose={() => setIsAddLeadDialogOpen(false)}
        onAddLead={handleAddLead}
      />
    </div>
  );
};

export { DashboardHeader };
export default DashboardHeader;
