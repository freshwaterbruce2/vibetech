
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type ButtonProps } from "@/components/ui/button";

// Create a separate type for NeonButtonProps that extends ButtonProps
// but overrides the variant property to use our custom variants
interface NeonButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "primary" | "secondary" | "accent" | "gradient" | "electric";
  glowIntensity?: "low" | "medium" | "high";
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "primary", glowIntensity = "medium", children, ...props }, ref) => {
    const variantStyles = {
      // Use the new color names from tokens.css
      primary: "border-[color:var(--c-primary)/30] hover:border-[color:var(--c-primary)/60] hover:shadow-neon-blue-soft before:from-[color:var(--c-primary)] before:to-[color:var(--c-primary)/70]",
      secondary: "border-[color:var(--c-secondary)/30] hover:border-[color:var(--c-secondary)/60] hover:shadow-neon-purple-soft before:from-[color:var(--c-secondary)] before:to-[color:var(--c-secondary)/70]",
      accent: "border-[color:var(--c-accent)/30] hover:border-[color:var(--c-accent)/60] hover:shadow-neon-teal-soft before:from-[color:var(--c-accent)] before:to-[color:var(--c-accent)/70]",
      electric: "border-[color:var(--c-accent)/30] hover:border-[color:var(--c-accent)/60] hover:shadow-neon-teal-soft before:from-[color:var(--c-accent)] before:to-[color:#00e0b0]/70]",
      gradient: "border-white/20 hover:border-white/40 hover:shadow-neon-blue-soft before:from-[color:var(--c-primary)] before:via-[color:var(--c-secondary)] before:to-[color:var(--c-accent)]",
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
      </Button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton };
