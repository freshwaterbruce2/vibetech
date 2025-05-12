
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
      className="text-center max-w-2xl mx-auto p-8 glass-card border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft"
    >
      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Need a custom solution?</h2>
      <p className="mb-6 text-slate-200/90">
        We offer tailored services for businesses with specific requirements. 
        Our custom plans provide the perfect balance between affordability and professional quality,
        with transparent pricing and no hidden fees.
      </p>
      <Button 
        className="bg-[rgba(148,38,255,0.2)] border border-[color:var(--c-purple)/30] hover:bg-[rgba(148,38,255,0.3)] hover:border-[color:var(--c-purple)/50] text-white relative overflow-hidden group"
        onClick={() => onRequestQuote("Custom")}
      >
        <span className="relative z-10">Get Custom Quote</span>
        <span className="absolute inset-0 bg-gradient-to-r from-[#8d4dff] via-[#c87eff] to-[#00f7ff] opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
      </Button>
    </motion.div>
  );
};

export default CustomQuote;
