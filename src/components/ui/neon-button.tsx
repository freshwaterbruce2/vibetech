
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
      blue: "border-[color:var(--c-cyan)/30] hover:border-[color:var(--c-cyan)/60] hover:shadow-neon-blue-soft before:from-[color:var(--c-cyan)] before:to-[color:var(--c-cyan)/70]",
      purple: "border-[color:var(--c-purple)/30] hover:border-[color:var(--c-purple)/60] hover:shadow-neon-purple-soft before:from-[color:var(--c-purple)] before:to-[color:var(--c-purple)/70]",
      teal: "border-[color:#00FFCC]/30 hover:border-[color:#00FFCC]/60 hover:shadow-neon-teal-soft before:from-[color:#00FFCC] before:to-[color:#00FFCC]/70",
      "electric-teal": "border-[color:#00ffcc]/30 hover:border-[color:#00ffcc]/60 hover:shadow-neon-teal-soft before:from-[color:#00ffcc] before:to-[color:#00e0b0]/70",
      gradient: "border-white/20 hover:border-white/40 hover:shadow-neon-blue-soft before:from-[color:var(--c-cyan)] before:via-[color:var(--c-purple)] before:to-[color:#00FFCC]",
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
        <span className="absolute inset-0 bg-gradient-to-r from-[color:var(--c-cyan)] via-[color:var(--c-purple)] to-[color:#00FFCC] opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
      </Button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton };
