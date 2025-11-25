
import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GradientFeatherIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  variant?: "blue-purple" | "purple-teal" | "blue-teal" | "full-gradient";
}

const GradientFeatherIcon = ({
  icon: Icon,
  size = 24,
  className,
  variant = "full-gradient",
}: GradientFeatherIconProps) => {
  const gradientId = React.useId();
  
  const gradientDefs = {
    "blue-purple": (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#28f0ff" />
        <stop offset="100%" stopColor="#9c57ff" />
      </linearGradient>
    ),
    "purple-teal": (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9c57ff" />
        <stop offset="100%" stopColor="#00ffcc" />
      </linearGradient>
    ),
    "blue-teal": (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#28f0ff" />
        <stop offset="100%" stopColor="#00ffcc" />
      </linearGradient>
    ),
    "full-gradient": (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#28f0ff" />
        <stop offset="50%" stopColor="#9c57ff" />
        <stop offset="100%" stopColor="#00ffcc" />
      </linearGradient>
    ),
  };

  return (
    <div className="relative inline-flex items-center justify-center group">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-futuristic-neonBlue via-futuristic-neonPurple to-futuristic-neonTeal opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
      
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>{gradientDefs[variant]}</defs>
      </svg>
      
      <Icon
        size={size}
        className={cn(
          "transition-all duration-300 group-hover:scale-110",
          className
        )}
        stroke={`url(#${gradientId})`}
        strokeWidth={1.5}
      />
    </div>
  );
};

export { GradientFeatherIcon };
