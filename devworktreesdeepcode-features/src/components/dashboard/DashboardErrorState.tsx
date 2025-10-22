
import { motion } from "framer-motion";

interface DashboardErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const DashboardErrorState = ({ error, onRetry }: DashboardErrorStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 text-center"
    >
      <p className="text-red-400 mb-4">{error}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-aura-accent rounded-md hover:bg-aura-accent/90"
      >
        Try Again
      </button>
    </motion.div>
  );
};

export default DashboardErrorState;
