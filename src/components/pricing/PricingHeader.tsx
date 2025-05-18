
import React from "react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/page-header";
import { motion } from "framer-motion";

interface PricingHeaderProps {
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (cycle: "monthly" | "yearly") => void;
}

const PricingHeader = ({ billingCycle, setBillingCycle }: PricingHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <PageHeader
        title="Pricing Made Simple"
        subtitle="Professional web design services at competitive rates. Get more value than DIY platforms with the quality of agency work at a fraction of the price."
      />
      
      {/* Value proposition */}
      <div className="flex justify-center mb-8">
        <Badge variant="outline" className="px-4 py-2 bg-aura-accent/10 text-aura-accent border-aura-accent/30 text-sm">
          Higher quality than DIY platforms, more affordable than agencies
        </Badge>
      </div>
      
      {/* Billing toggle with savings indicator */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-4">
          <span className={`mr-3 ${billingCycle === "monthly" ? "text-white font-medium" : "text-white/70"}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-accent focus-visible:ring-offset-2 ${
              billingCycle === "yearly" ? "bg-aura-accent" : "bg-aura-textSecondary/30"
            }`}
            aria-label={`Switch to ${billingCycle === "monthly" ? "yearly" : "monthly"} billing`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`ml-3 flex items-center ${billingCycle === "yearly" ? "text-white font-medium" : "text-white/70"}`}>
            Yearly 
            <Badge className="ml-1 bg-aura-accent/10 text-aura-accent border-aura-accent/30">Save 20%</Badge>
          </span>
        </div>
        
        {billingCycle === "yearly" && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-aura-accent"
          >
            You're saving up to $360 per year!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default PricingHeader;
