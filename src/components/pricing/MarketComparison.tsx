
import { motion } from "framer-motion";
import { MarketComparisonType } from "./types";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketComparisonProps {
  marketComparisons: MarketComparisonType[];
}

const MarketComparison = ({ marketComparisons }: MarketComparisonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-10 overflow-x-auto"
    >
      <div className="bg-aura-backgroundLight rounded-xl border border-aura-accent/10 p-6 md:p-8 shadow-lg">
        <div className="grid md:grid-cols-5 gap-6 md:gap-4">
          {/* Column headers */}
          <div className="hidden md:block"></div>
          {marketComparisons.map((comparison, i) => (
            <div 
              key={i} 
              className={`hidden md:block text-center ${comparison.highlighted ? "text-aura-accent font-bold" : "text-aura-textSecondary"}`}
            >
              {comparison.category}
            </div>
          ))}
          
          {/* Mobile view categories */}
          <div className="md:hidden space-y-8">
            {marketComparisons.map((comparison, i) => (
              <div key={i} className={`p-4 ${comparison.highlighted ? "bg-aura-accent/10 rounded-lg border border-aura-accent/30" : ""}`}>
                <h3 className={`text-center text-lg font-bold mb-4 ${comparison.highlighted ? "text-aura-accent" : "text-aura-text"}`}>
                  {comparison.category}
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="font-medium text-aura-text">Pricing:</div>
                  <div className={comparison.highlighted ? "font-bold text-aura-accent" : "text-aura-textSecondary"}>
                    {comparison.pricing}
                  </div>
                  
                  <div className="font-medium text-aura-text">Service:</div>
                  <div className={comparison.highlighted ? "font-medium text-aura-text" : "text-aura-textSecondary"}>
                    {comparison.description}
                  </div>
                  
                  <div className="font-medium text-aura-text">Features:</div>
                  <div className={comparison.highlighted ? "font-medium text-aura-text" : "text-aura-textSecondary"}>
                    {comparison.limitations}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop view rows */}
          <div className="hidden md:grid md:grid-cols-1 gap-6">
            <div className="flex items-center">
              <span className="font-medium text-aura-text">Pricing</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-4 w-4 text-aura-textSecondary" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-aura-backgroundLight border-[color:var(--c-purple)/20] text-aura-text">
                    Monthly costs or one-time project fees
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="font-medium text-aura-text">Service Type</div>
            
            <div className="flex items-center">
              <span className="font-medium text-aura-text">Features</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-4 w-4 text-aura-textSecondary" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-aura-backgroundLight border-[color:var(--c-purple)/20] text-aura-text">
                    Key capabilities and limitations
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {marketComparisons.map((comparison, i) => (
            <div 
              key={i}
              className={`hidden md:flex md:flex-col gap-6 ${
                comparison.highlighted 
                  ? "relative before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-aura-accent/5" 
                  : ""
              }`}
            >
              <div className={`text-center ${comparison.highlighted ? "font-bold text-aura-accent" : "text-aura-textSecondary"}`}>
                {comparison.pricing}
              </div>
              
              <div className={`text-center text-sm ${comparison.highlighted ? "font-medium text-aura-text" : "text-aura-textSecondary"}`}>
                {comparison.description}
              </div>
              
              <div className={`text-center text-sm ${comparison.highlighted ? "font-medium text-aura-text" : "text-aura-textSecondary"}`}>
                {comparison.limitations}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MarketComparison;
