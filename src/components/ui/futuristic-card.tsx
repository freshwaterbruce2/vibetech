
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "blue" | "purple" | "teal" | "glass";
  hoverEffect?: boolean;
}

const FuturisticCard = ({
  children,
  className,
  variant = "blue",
  hoverEffect = true,
}: FuturisticCardProps) => {
  const variants = {
    blue: "border-futuristic-neonBlue/30 hover:border-futuristic-neonBlue/50 shadow-neon-blue-soft",
    purple: "border-futuristic-neonPurple/30 hover:border-futuristic-neonPurple/50 shadow-neon-purple-soft",
    teal: "border-futuristic-neonTeal/30 hover:border-futuristic-neonTeal/50 shadow-neon-teal-soft",
    glass: "border-white/10 hover:border-white/20",
  };

  const hoverClasses = hoverEffect ? "transform hover:-translate-y-1 transition-all duration-300" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass-card p-6",
        variants[variant],
        hoverClasses,
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default FuturisticCard;
