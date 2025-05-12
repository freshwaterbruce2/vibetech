
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "blue" | "purple" | "teal" | "glass";
  hoverEffect?: boolean;
  glowIntensity?: "low" | "medium" | "high";
}

const FuturisticCard = ({
  children,
  className,
  variant = "blue",
  hoverEffect = true,
  glowIntensity = "medium",
}: FuturisticCardProps) => {
  const variants = {
    blue: "border-cyan/30 hover:border-cyan/60 shadow-neon-blue-soft",
    purple: "border-purple/30 hover:border-purple/60 shadow-neon-purple-soft",
    teal: "border-teal/30 hover:border-teal/60 shadow-neon-teal-soft",
    glass: "border-white/10 hover:border-white/20",
  };

  const glowStyles = {
    low: "after:opacity-20 hover:after:opacity-30",
    medium: "after:opacity-40 hover:after:opacity-60",
    high: "after:opacity-60 hover:after:opacity-80",
  };

  const hoverClasses = hoverEffect ? "transform hover:-translate-y-1 transition-all duration-300" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass-card p-6 relative",
        variants[variant],
        glowStyles[glowIntensity],
        hoverClasses,
        className
      )}
    >
      {variant !== "glass" && (
        <div className={cn(
          "absolute inset-0 -z-10 blur-xl rounded-xl opacity-20",
          {
            "bg-cyan": variant === "blue",
            "bg-purple": variant === "purple",
            "bg-teal": variant === "teal",
          }
        )} />
      )}
      {children}
    </motion.div>
  );
};

export default FuturisticCard;
