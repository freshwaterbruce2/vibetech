
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const leadFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  source: z.string(),
  status: z.string(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface AddLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: {
    name: string;
    email: string;
    source: string;
    status: string;
    date: string;
  }) => void;
}

export default function AddLeadDialog({ isOpen, onClose, onAddLead }: AddLeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      source: "Contact Form",
      status: "New",
    },
  });

  async function onSubmit(values: LeadFormValues) {
    setIsLoading(true);
    try {
      // Format today's date as YYYY-MM-DD
      const today = new Date();
      const date = today.toISOString().split('T')[0];
      
      // Create the new lead object
      const newLead = {
        ...values,
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
      
      // Reset form and close dialog
      form.reset();
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

  const leadSources = [
    "Contact Form",
    "Newsletter",
    "Service Page",
    "Portfolio",
    "Direct Contact",
    "Referral"
  ];

  const leadStatuses = [
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Closed"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-aura-backgroundLight border-aura-accent/20 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Lead</DialogTitle>
          <DialogDescription className="text-aura-textSecondary">
            Enter the lead information below to add them to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Lead Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-aura-backgroundLight border-aura-accent/20">
                      {leadSources.map((source) => (
                        <SelectItem key={source} value={source} className="text-white hover:bg-aura-accent/10">
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-aura-backgroundLight border-aura-accent/20">
                      {leadStatuses.map((status) => (
                        <SelectItem key={status} value={status} className="text-white hover:bg-aura-accent/10">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="bg-aura-backgroundDark text-white border-aura-accent/20 hover:bg-aura-accent/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-[color:var(--c-cyan)] to-[color:var(--c-purple)] relative group hover:shadow-neon-blue transition-all duration-300"
              >
                {isLoading ? "Adding..." : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
