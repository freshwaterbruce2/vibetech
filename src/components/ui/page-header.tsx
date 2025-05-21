
import React from "react";
import { motion } from "framer-motion";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";
import { cn } from "@/lib/utils";
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  glowColor?: "cyan" | "purple" | "pink" | "teal" | "gradient";
}
const PageHeader = ({
  title,
  subtitle,
  align = "center",
  className,
  size = "lg",
  glowColor = "gradient"
}: PageHeaderProps) => {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  };
  const sizeClasses = {
    sm: "text-2xl md:text-3xl lg:text-4xl",
    md: "text-3xl md:text-4xl lg:text-5xl",
    lg: "text-4xl md:text-5xl lg:text-6xl",
    xl: "text-5xl md:text-6xl lg:text-7xl"
  };
  const glowClasses = {
    cyan: "neon-text-glow",
    purple: "neon-text-glow-purple",
    pink: "neon-text-glow-pink",
    teal: "neon-text-glow-teal",
    gradient: "gradient-text-full"
  };
  const dividerClasses = {
    cyan: "neon-divider",
    purple: "neon-divider-purple",
    pink: "neon-divider-pink",
    teal: "neon-divider-teal",
    gradient: "neon-divider"
  };
  return <AnimateOnScroll>
      <div className={cn("mb-16", alignClasses[align], className)}>
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.7
      }} className="mb-4">
          <div className="inline-block">
            <h1 className={cn(sizeClasses[size], glowClasses[glowColor], "font-bold font-heading mb-6 tracking-tight relative")}>
              {title}
              <span className="absolute -inset-1 rounded-lg blur-xl bg-gradient-to-r from-[color:var(--c-primary)]/20 via-[color:var(--c-secondary)]/20 to-[color:var(--c-accent)]/20 z-[-1]"></span>
            </h1>
            <div className={cn("w-3/4 mx-auto", dividerClasses[glowColor])}></div>
          </div>
        </motion.div>
        {subtitle && <motion.p initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.2
      }} className="max-w-3xl mx-auto text-gray-300">
            {subtitle}
          </motion.p>}
      </div>
    </AnimateOnScroll>;
};
export default PageHeader;
