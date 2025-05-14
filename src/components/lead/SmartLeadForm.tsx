
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { enrichLeadWithClearbit } from "./SmartLeadEnricher";
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
  phone: z.string().optional(),
  serviceInterest: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface SmartLeadFormProps {
  variant?: "inline" | "popup" | "full";
  onSuccess?: () => void;
  buttonText?: string;
  showServiceInterest?: boolean;
}

export default function SmartLeadForm({ 
  variant = "full", 
  onSuccess, 
  buttonText = "Submit", 
  showServiceInterest = true
}: SmartLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceInterest: "",
    },
  });

  async function onSubmit(values: LeadFormValues) {
    setIsLoading(true);
    try {
      // Submit lead to Supabase
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          service_interest: values.serviceInterest || null,
        })
        .select();
      
      if (error) throw error;
      
      const leadId = data[0]?.id;
      
      if (leadId) {
        // Enrich the lead data using Clearbit (via our edge function)
        enrichLeadWithClearbit(leadId).catch(err => {
          console.error("Lead enrichment failed:", err);
          // Non-critical error, doesn't need to block the user
        });
      }

      // Show success message
      toast({
        title: "Lead captured successfully!",
        description: "Thank you for your interest. We'll be in touch soon.",
        variant: "success",
      });
      
      // Reset form
      form.reset();
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem submitting your information. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const services = [
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "SEO & Marketing",
    "Consulting"
  ];

  const formClasses = {
    inline: "flex flex-col sm:flex-row gap-2 items-end",
    popup: "space-y-3 p-4",
    full: "space-y-4 max-w-md mx-auto"
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={formClasses[variant]}>
        <div className={variant === "inline" ? "flex-1" : "w-full"}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                {variant !== "inline" && <FormLabel>Name</FormLabel>}
                <FormControl>
                  <Input 
                    placeholder="Your name" 
                    {...field} 
                    className={variant === "inline" ? "h-9" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className={variant === "inline" ? "flex-1" : "w-full"}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                {variant !== "inline" && <FormLabel>Email</FormLabel>}
                <FormControl>
                  <Input 
                    placeholder="Email address" 
                    type="email" 
                    {...field} 
                    className={variant === "inline" ? "h-9" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {variant !== "inline" && (
          <div className="w-full">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {showServiceInterest && variant !== "inline" && (
          <div className="w-full">
            <FormField
              control={form.control}
              name="serviceInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What service are you interested in?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading} 
          className={variant === "inline" ? "whitespace-nowrap h-9" : "w-full"}
        >
          {isLoading ? "Submitting..." : buttonText}
        </Button>
      </form>
    </Form>
  );
}
