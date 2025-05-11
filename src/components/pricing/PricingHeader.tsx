
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface PricingHeaderProps {
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (cycle: "monthly" | "yearly") => void;
}

const PricingHeader = ({ billingCycle, setBillingCycle }: PricingHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent"
      >
        Competitive Pricing Plans
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-aura-textSecondary max-w-3xl mx-auto mb-8"
      >
        Professional web design services at affordable rates. Get more value than DIY platforms 
        with the quality of agency work at a fraction of the price.
      </motion.p>
      
      {/* Market positioning badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-8"
      >
        <Badge variant="outline" className="px-4 py-2 bg-aura-accent/10 text-aura-accent border-aura-accent/30">
          Higher quality than DIY platforms, more affordable than agencies
        </Badge>
      </motion.div>
      
      {/* Billing toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex items-center justify-center mb-12"
      >
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
      </motion.div>
    </div>
  );
};

export default PricingHeader;
