
import React from "react";
import { motion } from "framer-motion";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

const PageHeader = ({ 
  title, 
  subtitle, 
  align = "center", 
  className 
}: PageHeaderProps) => {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  };

  return (
    <AnimateOnScroll>
      <div className={cn("mb-16", alignClasses[align], className)}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-4"
        >
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 gradient-text-full relative neon-text-glow">
              {title}
              <span className="absolute -inset-1 rounded-lg blur-xl bg-gradient-to-r from-[color:var(--c-cyan)]/20 via-[color:var(--c-purple)]/20 to-[color:var(--c-teal)]/20 z-[-1]"></span>
            </h1>
            <div className="neon-divider w-3/4 mx-auto"></div>
          </div>
        </motion.div>
        {subtitle && (
          <p className="text-aura-textSecondary max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </AnimateOnScroll>
  );
};

export default PageHeader;
