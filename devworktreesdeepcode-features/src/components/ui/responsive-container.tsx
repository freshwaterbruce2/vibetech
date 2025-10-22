
import * as React from "react"
import { cn } from "@/lib/utils"
import { useBreakpoints } from "@/hooks/use-breakpoints"
import { useBrowserCapabilities } from "@/hooks/use-browser-capabilities"

type ResponsiveContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none"
  padded?: boolean
  centered?: boolean
  adaptForTouch?: boolean
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ 
    className, 
    children, 
    as: Component = "div", 
    maxWidth = "xl", 
    padded = true,
    centered = true,
    adaptForTouch = true,
    ...props 
  }, ref) => {
    // Get current breakpoint
    const { current } = useBreakpoints();
    const { isTouchDevice } = useBrowserCapabilities();
    
    // Calculate appropriate padding based on screen size
    const getPadding = () => {
      if (!padded) return "";
      
      // Add extra padding for touch devices if requested
      const touchExtraPadding = (adaptForTouch && isTouchDevice) ? "py-2" : "";
      
      switch (current) {
        case "xs":
          return `px-4 ${touchExtraPadding}`;
        case "sm":
          return `px-6 ${touchExtraPadding}`;
        default:
          return `px-4 sm:px-6 md:px-8 ${touchExtraPadding}`;
      }
    };
    
    // Calculate max-width based on prop
    const getMaxWidth = () => {
      switch (maxWidth) {
        case "xs":
          return "max-w-xs";
        case "sm":
          return "max-w-screen-sm";
        case "md":
          return "max-w-screen-md";  
        case "lg":
          return "max-w-screen-lg";
        case "xl":
          return "max-w-screen-xl";
        case "2xl":
          return "max-w-screen-2xl";
        case "full":
          return "max-w-full";
        case "none":
          return "";
        default:
          return "max-w-screen-xl";
      }
    };
    
    // Add touch-friendly classes if needed
    const getTouchClasses = () => {
      if (adaptForTouch && isTouchDevice) {
        return "touch-manipulation"; // CSS touch-action property
      }
      return "";
    };

    return (
      <Component
        ref={ref}
        className={cn(
          getMaxWidth(),
          getPadding(),
          getTouchClasses(),
          centered && "mx-auto",
          "w-full",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ResponsiveContainer.displayName = "ResponsiveContainer";

export { ResponsiveContainer };
