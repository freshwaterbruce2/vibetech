
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "gradient" | "full-gradient";
}

const SectionHeading = ({
  children,
  className,
  align = "center",
  size = "lg",
  variant = "default"
}: SectionHeadingProps) => {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const sizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl",
    xl: "text-4xl md:text-5xl lg:text-[2.5rem]",
  };
  
  const variantClasses = {
    default: "text-aura-text",
    gradient: "gradient-text",
    "full-gradient": "gradient-text-full",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(alignmentClasses[align], "mb-10", className)}
    >
      <h2 className={cn(
        "font-heading font-extrabold slice-heading tracking-tight",
        sizeClasses[size],
        variantClasses[variant]
      )}>
        {children}
      </h2>
    </motion.div>
  );
};

export default SectionHeading;
