
import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GradientIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  variant?: "blue" | "purple" | "teal" | "gradient";
}

const GradientIcon = ({
  icon: Icon,
  size = 24,
  className,
  variant = "gradient",
}: GradientIconProps) => {
  const gradients = {
    blue: "from-futuristic-neonBlue to-futuristic-neonBlue/70",
    purple: "from-futuristic-neonPurple to-futuristic-neonPurple/70",
    teal: "from-futuristic-neonTeal to-futuristic-neonTeal/70",
    gradient: "from-futuristic-neonBlue via-futuristic-neonPurple to-futuristic-neonTeal",
  };

  return (
    <div className="relative inline-flex items-center justify-center group">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-futuristic-neonBlue via-futuristic-neonPurple to-futuristic-neonTeal opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
      
      {/* Icon with gradient */}
      <Icon
        size={size}
        className={cn(
          "relative z-10 text-transparent bg-clip-text bg-gradient-to-r transition-all duration-300",
          gradients[variant],
          className
        )}
        aria-hidden="true"
      />
    </div>
  );
};

export { GradientIcon };
