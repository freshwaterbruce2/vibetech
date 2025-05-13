
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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center max-w-3xl mx-auto p-8 md:p-12 rounded-2xl relative overflow-hidden"
    >
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(148,38,255,0.15)] to-[rgba(0,247,255,0.15)] z-[-1]"></div>
      <div className="absolute inset-0 backdrop-blur-xl border border-[rgba(148,38,255,0.3)] rounded-2xl z-[-1]"></div>
      
      {/* Content */}
      <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
        Need a custom solution?
      </h2>
      <p className="mb-8 text-aura-text max-w-xl mx-auto">
        We offer tailored services for businesses with specific requirements. 
        Our custom plans provide the perfect balance between affordability and professional quality,
        with transparent pricing and no hidden fees.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          className="bg-gradient-to-r from-[rgba(148,38,255,0.8)] to-[rgba(0,247,255,0.8)] hover:from-[rgba(148,38,255,0.9)] hover:to-[rgba(0,247,255,0.9)] text-white px-6 py-6 h-auto text-lg font-medium relative overflow-hidden group"
          onClick={() => onRequestQuote("Custom")}
        >
          <span className="relative z-10">Get Custom Quote</span>
        </Button>
        <Button
          variant="outline"
          className="border-[rgba(148,38,255,0.3)] text-aura-text hover:bg-[rgba(148,38,255,0.1)] hover:text-aura-text px-6 py-6 h-auto text-lg font-medium"
          onClick={() => window.location.href = '/contact'}
        >
          Contact Sales Team
        </Button>
      </div>
      
      {/* Extra confidence builder */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
        <div className="flex flex-col items-center">
          <div className="text-aura-accent text-xl font-bold mb-1">100%</div>
          <div className="text-aura-textSecondary">Satisfaction Guarantee</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-aura-accent text-xl font-bold mb-1">24/7</div>
          <div className="text-aura-textSecondary">Customer Support</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-aura-accent text-xl font-bold mb-1">14-Day</div>
          <div className="text-aura-textSecondary">Risk-Free Trial</div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomQuote;
