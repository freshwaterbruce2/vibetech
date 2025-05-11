
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CustomQuoteProps {
  onRequestQuote: (plan: string) => void;
}

const CustomQuote = ({ onRequestQuote }: CustomQuoteProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0 }}
      className="text-center max-w-2xl mx-auto p-8 glass-card border-futuristic-neonPurple/30 hover:border-futuristic-neonPurple/50"
    >
      <h2 className="text-2xl font-bold mb-4 gradient-text">Need a custom solution?</h2>
      <p className="mb-6 text-aura-textSecondary">
        We offer tailored services for businesses with specific requirements. 
        Our custom plans provide the perfect balance between affordability and professional quality,
        with transparent pricing and no hidden fees.
      </p>
      <Button 
        className="neon-sweep-btn text-white relative overflow-hidden group"
        onClick={() => onRequestQuote("Custom")}
      >
        <span className="relative z-10">Get Custom Quote</span>
        <span className="absolute inset-0 bg-gradient-to-r from-futuristic-neonBlue via-futuristic-neonPurple to-futuristic-neonTeal opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
      </Button>
    </motion.div>
  );
};

export default CustomQuote;
