
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import PageLayout from "@/components/layout/PageLayout";

// Import our components
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
    <PageLayout title="Pricing">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16"
      >
        <PricingHeader 
          billingCycle={billingCycle} 
          setBillingCycle={setBillingCycle} 
        />

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
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
        
        {/* Market Comparison Section */}
        <div className="my-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#c87eff] to-[#00f7ff] bg-clip-text text-transparent">
            See How We Compare
          </h2>
          <MarketComparison marketComparisons={marketComparisons} />
        </div>

        {/* Custom Quote Section */}
        <div className="my-20">
          <CustomQuote onRequestQuote={handleSubscribe} />
        </div>
        
        {/* FAQ Section */}
        <div className="mt-20">
          <PricingFAQ />
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Pricing;
