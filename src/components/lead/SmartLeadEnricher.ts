
import { supabase } from "@/integrations/supabase/client";

export async function enrichLeadWithClearbit(leadId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('enrich-lead', {
      body: { leadId }
    });
    
    if (error) {
      console.error('Error enriching lead:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception while enriching lead:', err);
    return { success: false, error: err };
  }
}
