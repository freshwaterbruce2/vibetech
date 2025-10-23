
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DashboardEmptyState = ({ icon: Icon, title, description }: DashboardEmptyStateProps) => {
  return (
    <Card className="bg-aura-darkBgLight/80 backdrop-blur-sm border-aura-neonBlue/20 tech-card relative overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-aura-neonBlue/10 to-aura-neonPurple/10 rounded-lg blur-3xl -z-10"></div>
      
      <CardHeader>
        <CardTitle className="text-aura-text flex items-center gap-2">
          <span className="inline-block w-2 h-6 bg-aura-neonBlue rounded-sm pulse"></span> 
          {title}
        </CardTitle>
        <CardDescription className="text-aura-textSecondary">Manage your {title.toLowerCase()}</CardDescription>
      </CardHeader>
      
      <CardContent className="h-80 flex items-center justify-center relative">
        <div className="absolute w-40 h-40 bg-aura-neonBlue/5 rounded-full blur-3xl"></div>
        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <Icon className="h-16 w-16 mx-auto mb-6 text-aura-neonBlue" />
            <div className="absolute inset-0 bg-aura-neonBlue/20 rounded-full blur-xl -z-10"></div>
          </motion.div>
          <h3 className="text-xl font-medium mb-2 text-aura-text">No {title.toLowerCase()} yet</h3>
          <p className="text-aura-textSecondary max-w-xs mx-auto">{description}</p>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default DashboardEmptyState;
