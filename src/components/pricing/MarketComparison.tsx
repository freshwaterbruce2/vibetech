
import { motion } from "framer-motion";
import { MarketComparisonType } from "./types";

interface MarketComparisonProps {
  marketComparisons: MarketComparisonType[];
}

const MarketComparison = ({ marketComparisons }: MarketComparisonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mb-16 overflow-x-auto"
    >
      <div className="bg-aura-backgroundLight rounded-xl border border-aura-accent/10 p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">How We Compare</h2>
        <div className="min-w-full">
          <div className="grid grid-cols-5 gap-4 mb-4 text-sm font-medium text-aura-textSecondary">
            <div></div>
            {marketComparisons.map((comparison, i) => (
              <div 
                key={i} 
                className={`text-center ${comparison.highlighted ? "text-aura-accent" : ""}`}
              >
                {comparison.category}
              </div>
            ))}
          </div>
          
          <div className="space-y-4">
            {/* Pricing Row */}
            <div className="grid grid-cols-5 gap-4">
              <div className="font-medium text-aura-text">Pricing</div>
              {marketComparisons.map((comparison, i) => (
                <div 
                  key={i} 
                  className={`text-center ${comparison.highlighted 
                    ? "font-bold text-aura-accent" 
                    : "text-aura-textSecondary"}`}
                >
                  {comparison.pricing}
                </div>
              ))}
            </div>
            
            {/* Description Row */}
            <div className="grid grid-cols-5 gap-4">
              <div className="font-medium text-aura-text">Service</div>
              {marketComparisons.map((comparison, i) => (
                <div 
                  key={i} 
                  className={`text-center text-sm ${comparison.highlighted 
                    ? "font-medium text-aura-text" 
                    : "text-aura-textSecondary"}`}
                >
                  {comparison.description}
                </div>
              ))}
            </div>
            
            {/* Limitations Row */}
            <div className="grid grid-cols-5 gap-4">
              <div className="font-medium text-aura-text">Features</div>
              {marketComparisons.map((comparison, i) => (
                <div 
                  key={i} 
                  className={`text-center text-sm ${comparison.highlighted 
                    ? "font-medium text-aura-text" 
                    : "text-aura-textSecondary"}`}
                >
                  {comparison.limitations}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketComparison;
