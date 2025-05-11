
import React from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/section-heading";
import ToolCard, { ToolCardProps } from "./ToolCard";

interface ToolsHeroSectionProps {
  toolsData: ToolCardProps[];
}

const ToolsHeroSection: React.FC<ToolsHeroSectionProps> = ({ toolsData }) => {
  return (
    <section className="pt-28 pb-16 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading size="xl">
          Power Your Digital Presence with <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Advanced Tools</span>
        </SectionHeading>
        <p className="text-aura-textSecondary text-lg max-w-3xl mx-auto text-center mb-10">
          Discover our carefully curated suite of tools and integrations designed to enhance your online presence, 
          optimize your marketing efforts, and streamline your business operations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsData.map((tool, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ToolCard {...tool} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsHeroSection;
