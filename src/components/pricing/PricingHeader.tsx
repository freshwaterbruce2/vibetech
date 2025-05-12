
import React from "react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/page-header";

interface PricingHeaderProps {
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (cycle: "monthly" | "yearly") => void;
}

const PricingHeader = ({ billingCycle, setBillingCycle }: PricingHeaderProps) => {
  return (
    <div className="mb-12">
      <PageHeader
        title="Competitive Pricing Plans"
        subtitle="Professional web design services at affordable rates. Get more value than DIY platforms with the quality of agency work at a fraction of the price."
      />
      
      {/* Market positioning badge */}
      <div className="flex justify-center mb-8">
        <Badge variant="outline" className="px-4 py-2 bg-aura-accent/10 text-aura-accent border-aura-accent/30">
          Higher quality than DIY platforms, more affordable than agencies
        </Badge>
      </div>
      
      {/* Billing toggle */}
      <div className="flex items-center justify-center mb-12">
        <span className={`mr-3 ${billingCycle === "monthly" ? "text-aura-text" : "text-aura-textSecondary"}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-accent focus-visible:ring-offset-2 ${
            billingCycle === "yearly" ? "bg-aura-accent" : "bg-aura-textSecondary/30"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
              billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`ml-3 ${billingCycle === "yearly" ? "text-aura-text" : "text-aura-textSecondary"}`}>
          Yearly <Badge variant="outline" className="ml-1 bg-aura-accent/10 text-aura-accent">20% off</Badge>
        </span>
      </div>
    </div>
  );
};

export default PricingHeader;
