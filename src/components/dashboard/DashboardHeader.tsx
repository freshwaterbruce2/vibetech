
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/page-header";

interface DashboardHeaderProps {
  title: string;
  className?: string;
}

const DashboardHeader = ({ title, className = "" }: DashboardHeaderProps) => {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${className}`}>
      <div className="flex-grow">
        <PageHeader 
          title={title}
          align="left"
          className="mb-0"
        />
        <p className="text-sm text-aura-textSecondary mt-1">Bruce Freshwater's CRM</p>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="md:ml-auto"
      >
        <Button 
          className="bg-gradient-to-r from-[color:var(--c-cyan)] to-[color:var(--c-purple)] relative group hover:shadow-neon-blue transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[color:var(--c-cyan)/10] to-[color:var(--c-purple)/10] group-hover:opacity-80 transition-opacity"></span>
          <PlusCircle className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
          <span className="relative z-10">New Lead</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardHeader;
