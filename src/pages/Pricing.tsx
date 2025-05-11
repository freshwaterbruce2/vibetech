
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

// Import our new components
import PricingHeader from "@/components/pricing/PricingHeader";
import PricingTier from "@/components/pricing/PricingTier";
import MarketComparison from "@/components/pricing/MarketComparison";
import CustomQuote from "@/components/pricing/CustomQuote";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import { pricingTiers, marketComparisons } from "@/components/pricing/pricingData";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  const handleSubscribe = (plan: string) => {
    toast.success(`Thank you for your interest in our ${plan} plan! A sales representative will contact you shortly.`);
  };

  return (
    <div className="min-h-screen bg-aura-background pb-16">
      <NavBar />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 pt-24"
      >
        <PricingHeader 
          billingCycle={billingCycle} 
          setBillingCycle={setBillingCycle} 
        />

        <MarketComparison marketComparisons={marketComparisons} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <PricingTier
              key={tier.name}
              tier={tier}
              billingCycle={billingCycle}
              index={index}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>

        <CustomQuote onRequestQuote={handleSubscribe} />
        
        <PricingFAQ />
      </motion.div>
    </div>
  );
};

export default Pricing;
