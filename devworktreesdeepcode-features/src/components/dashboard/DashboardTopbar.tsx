
import React from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardRefreshButton from "./DashboardRefreshButton";
import NotificationBadge from "./NotificationBadge";

interface DashboardTopbarProps {
  onRefresh: () => void;
  isPro?: boolean;
  onAddLead?: (lead: {
    name: string;
    email: string;
    source: string;
    status: string;
    date: string;
  }) => void;
}

const DashboardTopbar = ({ onRefresh, isPro = false, onAddLead }: DashboardTopbarProps) => {
  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="flex justify-end">
        <div className="flex items-center gap-4">
          <NotificationBadge />
          <DashboardRefreshButton onRefresh={onRefresh} />
        </div>
      </div>
      <DashboardHeader 
        title="Bruce Freshwater's CRM" 
        onAddLead={onAddLead}
      />
      {isPro && (
        <div className="flex justify-end -mt-4">
          <span className="bg-aura-neonBlue/5 text-aura-neonBlue text-xs px-2 py-1 rounded border border-aura-neonBlue/10">
            Pro Plan
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardTopbar;
