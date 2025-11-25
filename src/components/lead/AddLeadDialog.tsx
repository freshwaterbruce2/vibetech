
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddLeadForm from "./AddLeadForm";
import { LeadFormValues, AddLeadData } from "./LeadFormTypes";

interface AddLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: AddLeadData) => void;
}

export default function AddLeadDialog({ isOpen, onClose, onAddLead }: AddLeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  async function onSubmit(values: LeadFormValues) {
    setIsLoading(true);
    try {
      // Format today's date as YYYY-MM-DD
      const today = new Date();
      const date = today.toISOString().split('T')[0];
      
      // Create the new lead object with all required fields
      const newLead = {
        name: values.name, 
        email: values.email,
        source: values.source,
        status: values.status,
        date,
      };
      
      // Call the onAddLead function passed from the parent
      onAddLead(newLead);
      
      // Show success message
      toast({
        title: "Lead added successfully!",
        description: "New lead has been added to your dashboard.",
        variant: "success",
      });
      
      // Close dialog
      onClose();
      
    } catch (error) {
      console.error("Error adding lead:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem adding the lead. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-aura-backgroundLight border-aura-accent/20 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Lead</DialogTitle>
          <DialogDescription className="text-aura-textSecondary">
            Enter the lead information below to add them to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <AddLeadForm 
          onSubmit={onSubmit} 
          onCancel={onClose} 
          isLoading={isLoading} 
        />
      </DialogContent>
    </Dialog>
  );
}
