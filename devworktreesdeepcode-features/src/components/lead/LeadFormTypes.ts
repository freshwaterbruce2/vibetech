
import { z } from "zod";

export const LeadFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  source: z.string(),
  status: z.string(),
});

export type LeadFormValues = z.infer<typeof LeadFormSchema>;

export interface AddLeadData {
  name: string;
  email: string;
  source: string;
  status: string;
  date: string;
}
