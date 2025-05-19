
// Define the types used across dashboard data components
export interface Lead {
  id: number;
  name: string;
  email: string;
  source: string;
  status: string;
  date: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  conversionRate: string;
  avgResponseTime: string;
}

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Closed";
