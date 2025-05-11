
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
      className="text-center max-w-2xl mx-auto p-8 bg-aura-backgroundLight rounded-xl border border-aura-accent/10 shadow-md"
    >
      <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
      <p className="mb-6 text-aura-textSecondary">
        We offer tailored services for businesses with specific requirements. 
        Our custom plans provide the perfect balance between affordability and professional quality,
        with transparent pricing and no hidden fees.
      </p>
      <Button 
        className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary text-white hover:shadow-lg hover:shadow-aura-accent/20 transition-all"
        onClick={() => onRequestQuote("Custom")}
      >
        Get Custom Quote
      </Button>
    </motion.div>
  );
};

export default CustomQuote;
