
import { useState } from "react";
import { Lead, DashboardMetrics } from "./dashboard/types";
import { mockLeads, mockMetrics } from "./dashboard/mockData";
import { useLeadActions } from "./dashboard/useLeadActions";
import { useDashboardRefresh } from "./dashboard/useDashboardRefresh";
import { useNotificationEffects } from "./dashboard/useNotificationEffects";

export const useDashboardData = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
  const [isPro, _setIsPro] = useState(true);
  
  // Custom hooks for different features
  const { deleteLead, addLead } = useLeadActions(leads, setLeads, setMetrics);
  const { loadDashboardData, isInitialLoadRef, dataLoadedRef } = useDashboardRefresh(
    setLeads,
    setMetrics,
    setError,
    setIsLoading
  );
  
  // Setup notification effects
  useNotificationEffects(isInitialLoadRef, dataLoadedRef, loadDashboardData);

  return {
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
  };
};
