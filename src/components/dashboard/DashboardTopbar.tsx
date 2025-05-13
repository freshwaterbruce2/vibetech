
import { motion } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRefreshButton from "@/components/dashboard/DashboardRefreshButton";
import NotificationBadge from "@/components/dashboard/NotificationBadge";

interface DashboardTopbarProps {
  onRefresh: () => void;
  isPro?: boolean; // New optional prop
}

const DashboardTopbar = ({ onRefresh, isPro = false }: DashboardTopbarProps) => {
  return (
    <motion.div variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
      }
    }} className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <DashboardHeader title="CRM Dashboard" />
        {isPro && (
          <span className="bg-gradient-to-r from-aura-neonBlue to-aura-neonPurple bg-clip-text text-transparent text-xs font-semibold">
            PRO
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationBadge />
        <DashboardRefreshButton onRefresh={onRefresh} />
      </div>
    </motion.div>
  );
};

export default DashboardTopbar;
