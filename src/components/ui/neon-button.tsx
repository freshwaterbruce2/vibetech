
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type ButtonProps } from "@/components/ui/button";

// Create a separate type for NeonButtonProps that extends ButtonProps
// but overrides the variant property to use our custom variants
interface NeonButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "blue" | "purple" | "teal" | "gradient" | "electric-teal";
  glowIntensity?: "low" | "medium" | "high";
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "blue", glowIntensity = "medium", children, ...props }, ref) => {
    const variantStyles = {
      blue: "border-futuristic-neonBlue/30 hover:border-futuristic-neonBlue/60 hover:shadow-neon-blue-soft before:from-futuristic-neonBlue before:to-futuristic-neonBlue/70",
      purple: "border-futuristic-neonPurple/30 hover:border-futuristic-neonPurple/60 hover:shadow-neon-purple-soft before:from-futuristic-neonPurple before:to-futuristic-neonPurple/70",
      teal: "border-futuristic-neonTeal/30 hover:border-futuristic-neonTeal/60 hover:shadow-neon-teal-soft before:from-futuristic-neonTeal before:to-futuristic-neonTeal/70",
      "electric-teal": "border-[#00ffcc]/30 hover:border-[#00ffcc]/60 hover:shadow-neon-teal-soft before:from-[#00ffcc] before:to-[#00e0b0]/70",
      gradient: "border-white/20 hover:border-white/40 hover:shadow-neon-blue-soft before:from-futuristic-neonBlue before:via-futuristic-neonPurple before:to-futuristic-neonTeal",
    };
    
    const glowStyles = {
      low: "hover:shadow-sm",
      medium: "hover:shadow-md",
      high: "hover:shadow-lg",
    };

    return (
      <Button
        className={cn(
          "neon-sweep-btn text-white relative overflow-hidden group bg-futuristic-darkBgLight",
          "transition-all duration-300 transform hover:-translate-y-[2px]",
          variantStyles[variant],
          glowStyles[glowIntensity],
          className
        )}
        ref={ref}
        // Pass variant="default" to the Button component to use shadcn's default style
        // while allowing our custom variants through the custom className
        variant="default"
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <span className="absolute inset-0 bg-gradient-to-r from-futuristic-neonBlue via-futuristic-neonPurple to-futuristic-neonTeal opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
      </Button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton };
