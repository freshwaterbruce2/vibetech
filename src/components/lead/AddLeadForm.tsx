
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadFormSchema, LeadFormValues } from "./LeadFormTypes";

interface AddLeadFormProps {
  onSubmit: (values: LeadFormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function AddLeadForm({ onSubmit, onCancel, isLoading }: AddLeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(LeadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      source: "Contact Form",
      status: "New",
    },
  });

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

  const handleSubmit = (values: LeadFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
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
        </div>
      </form>
    </Form>
  );
}
