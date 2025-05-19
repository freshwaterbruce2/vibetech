
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
        title={isPro ? "Pro Dashboard" : "Dashboard"} 
        onAddLead={onAddLead}
      />
    </div>
  );
};

export default DashboardTopbar;
