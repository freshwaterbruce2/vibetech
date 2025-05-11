
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  title: string;
}

const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl md:text-4xl font-bold font-heading neon-text relative"
      >
        {title}
        <span className="absolute -inset-1 blur-md bg-aura-neonBlue/20 rounded-lg -z-10"></span>
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Button 
          className="bg-gradient-to-r from-aura-neonBlue to-aura-neonCyan relative group hover:shadow-neon-blue transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-aura-neonBlue/10 to-aura-neonCyan/10 group-hover:opacity-80 transition-opacity"></span>
          <PlusCircle className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
          <span className="relative z-10">New Lead</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardHeader;
