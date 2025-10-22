
import { Lead } from "./types";
import { useNotifications } from "@/context/NotificationsContext";
import { toast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";

export const useLeadActions = (leads: Lead[], setLeads: React.Dispatch<React.SetStateAction<Lead[]>>, setMetrics: React.Dispatch<React.SetStateAction<Record<string, unknown>>>) => {
  const { addNotification } = useNotifications();
  const { trackLeadAction } = useAnalytics();

  // Delete lead function
  const deleteLead = (leadId: number) => {
    try {
      // Find the lead to be deleted for analytics tracking
      const leadToDelete = leads.find(lead => lead.id === leadId);
      
      // Filter out the lead with the given ID
      const updatedLeads = leads.filter(lead => lead.id !== leadId);
      setLeads(updatedLeads);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalLeads: prev.totalLeads - 1
      }));
      
      // Track lead deletion for analytics
      if (leadToDelete) {
        trackLeadAction('delete_success', { 
          id: leadToDelete.id, 
          name: leadToDelete.name 
        });
      }
      
      // Show success notification
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully removed.",
        variant: "success"
      });
      
      addNotification({
        title: "Lead Deleted",
        message: "Lead has been successfully removed from your dashboard.",
        type: "info"
      });
      
      return true;
    } catch (error) {
      console.error("Failed to delete lead:", error);
      
      // Track failed deletion for analytics - Fix the type error by providing both id and name
      trackLeadAction('delete_error', { 
        id: leadId,
        name: "Unknown" // Provide a default name since we don't have the actual name in error case
      });
      
      // Show error notification
      toast({
        variant: "destructive",
        title: "Error deleting lead",
        description: "Could not delete the lead. Please try again."
      });
      
      return false;
    }
  };

  // Add lead function
  const addLead = (leadData: { name: string; email: string; source: string; status: string; date: string }) => {
    try {
      // Generate a new ID (in a real app, this would be handled by the database)
      const newId = Math.max(...leads.map(lead => lead.id), 0) + 1;
      
      // Create the new lead with the generated ID
      const newLead: Lead = {
        id: newId,
        ...leadData
      };
      
      // Add the new lead to the leads array
      setLeads(prevLeads => [newLead, ...prevLeads]);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalLeads: prev.totalLeads + 1,
        newLeadsToday: prev.newLeadsToday + 1
      }));
      
      // Track lead addition for analytics
      trackLeadAction('add_success', { 
        id: newId, 
        name: leadData.name 
      });
      
      // Add a notification
      addNotification({
        title: "New Lead Added",
        message: `${leadData.name} has been added as a new lead.`,
        type: "success"
      });
      
      return true;
    } catch (error) {
      console.error("Failed to add lead:", error);
      
      // Track failed addition for analytics - Make sure we follow the required type structure
      trackLeadAction('add_error', { 
        id: 0, // Provide a default ID since we don't have one in the error case
        name: "Unknown" // Provide a default name for the error case
      });
      
      return false;
    }
  };

  return { deleteLead, addLead };
};
