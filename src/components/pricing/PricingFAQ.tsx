
import { motion } from "framer-motion";

const PricingFAQ = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.1 }}
      className="mt-16 max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        <div className="bg-aura-backgroundLight rounded-lg p-6 border border-aura-accent/10">
          <h3 className="font-bold text-xl mb-2">How do your prices compare to freelancers?</h3>
          <p className="text-aura-textSecondary">
            While freelancer rates typically range from $30-150 per hour (often resulting in unpredictable project costs),
            our subscription model provides consistent, professional service at a fixed monthly rate. This eliminates surprise 
            costs and ensures ongoing support.
          </p>
        </div>
        
        <div className="bg-aura-backgroundLight rounded-lg p-6 border border-aura-accent/10">
          <h3 className="font-bold text-xl mb-2">Why choose your service over DIY platforms?</h3>
          <p className="text-aura-textSecondary">
            DIY platforms like Wix or Squarespace ($14-39/month) offer templates but lack professional design expertise. 
            Our service includes custom professional design, development, and ongoing support at competitive rates, 
            resulting in a higher-quality, unique website that truly represents your brand.
          </p>
        </div>
        
        <div className="bg-aura-backgroundLight rounded-lg p-6 border border-aura-accent/10">
          <h3 className="font-bold text-xl mb-2">Can I upgrade or downgrade my plan?</h3>
          <p className="text-aura-textSecondary">
            Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you'll be charged the prorated 
            difference for the remainder of your billing cycle. If you downgrade, the new rate will apply at the start 
            of your next billing cycle.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingFAQ;
