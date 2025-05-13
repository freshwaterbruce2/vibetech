
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache the Supabase client instance
const createSupabaseClient = (req) => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
      },
    }
  );
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createSupabaseClient(req);
    
    const { leadId } = await req.json();
    console.log(`Processing lead enrichment for leadId: ${leadId}`);
    
    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Get the lead data
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
      
    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lead data' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }
    
    // In a production environment, you would use the Clearbit API here
    // For demo purposes, we'll simulate the enrichment process with improved data
    
    // Simulated company data based on email domain
    const emailDomain = lead.email.split('@')[1];
    let companyData = null;
    let socialLinks = {};
    
    if (emailDomain) {
      // Using EdgeRuntime.waitUntil for background processing if supported
      const enrichmentPromise = async () => {
        console.log(`Enriching data for domain: ${emailDomain}`);
        
        // Pro plan simulation with more detailed enrichment
        if (emailDomain.includes('gmail') || emailDomain.includes('hotmail') || emailDomain.includes('yahoo')) {
          companyData = null; // Personal email
        } else {
          // More detailed company data in Pro plan
          companyData = emailDomain.split('.')[0]; 
          socialLinks = {
            linkedin: `https://linkedin.com/company/${companyData}`,
            twitter: `https://twitter.com/${companyData}`,
            facebook: `https://facebook.com/${companyData}`,
            instagram: `https://instagram.com/${companyData}`,
            website: `https://${emailDomain}`
          };
        }
        
        // Update the lead with enriched data
        return await supabaseClient
          .from('leads')
          .update({
            company: companyData,
            social_links: socialLinks
          })
          .eq('id', leadId)
          .select()
          .single();
      };
      
      // Use waitUntil if available (on Pro plan can handle background tasks better)
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        const { data: updatedLead, error: updateError } = await enrichmentPromise();
        
        if (updateError) {
          console.error('Error updating lead:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update lead with enriched data' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            lead: updatedLead
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      } else {
        // Fallback for environments without waitUntil
        const { data: updatedLead, error: updateError } = await enrichmentPromise();
        
        if (updateError) {
          console.error('Error updating lead:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update lead with enriched data' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            lead: updatedLead
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        lead: lead
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
