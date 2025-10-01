
import React from "react";
import FuturisticCard from "@/components/ui/futuristic-card";
import { motion } from "framer-motion";

export interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  tools: string[];
  variant?: "blue" | "purple" | "teal";
}

const ToolCard = ({ title, description, icon, category, tools, variant = "blue" }: ToolCardProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <FuturisticCard className="h-full" variant={variant}>
      <div className="flex flex-col h-full">
        <div className="mb-6 flex items-start justify-between">
          <div className="p-3 rounded-lg bg-aura-backgroundLight/50">
            {icon}
          </div>
          <span className="text-xs uppercase tracking-wider text-aura-accent/70">
            {category}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold mb-3 font-heading text-white">
          {title}
        </h3>
        
        <p className="text-white mb-6 flex-grow">
          {description}
        </p>
        
        <div className="mt-auto">
          <h4 className="text-sm font-semibold mb-2 text-aura-accent">Featured Tools</h4>
          <motion.ul 
            className="space-y-1"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {tools.map((tool, index) => (
              <motion.li 
                key={index} 
                className="text-sm text-white flex items-center"
                variants={item}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-aura-accent mr-2"></span>
                {tool}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </FuturisticCard>
  );
};

export default ToolCard;
