
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg" | "xl";
}

const SectionHeading = ({
  children,
  className,
  align = "center",
  size = "lg",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(alignmentClasses[align], "mb-10", className)}
    >
      <h2 className={cn("font-heading font-extrabold slice-heading", sizeClasses[size])}>
        {children}
      </h2>
    </motion.div>
  );
};

export default SectionHeading;
