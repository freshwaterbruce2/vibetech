
import { supabase } from "@/integrations/supabase/client";

export async function enrichLeadWithClearbit(leadId: string) {
  try {
    // Using optimized config for Pro plan
    const { data, error } = await supabase.functions.invoke('enrich-lead', {
      body: { leadId },
      // Pro plan has higher compute resources, we can take advantage of this
      headers: {
        'x-priority': 'high' // Custom header for Pro plan priority processing
      }
    });
    
    if (error) {
      console.error('Error enriching lead:', error);
      return { success: false, error };
    }
    
    // Log success for monitoring
    console.log('Lead enriched successfully:', data.lead.id);
    return { success: true, data };
  } catch (err) {
    console.error('Exception while enriching lead:', err);
    return { success: false, error: err };
  }
}
