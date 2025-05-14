
import * as React from "react"
import { cn } from "@/lib/utils"
import { useBreakpoints } from "@/hooks/use-breakpoints"

type ResponsiveContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none"
  padded?: boolean
  centered?: boolean
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ 
    className, 
    children, 
    as: Component = "div", 
    maxWidth = "xl", 
    padded = true,
    centered = true,
    ...props 
  }, ref) => {
    // Get current breakpoint
    const { current } = useBreakpoints()
    
    // Calculate appropriate padding based on screen size
    const getPadding = () => {
      if (!padded) return ""
      
      switch (current) {
        case "xs":
          return "px-4"
        case "sm":
          return "px-6"
        default:
          return "px-4 sm:px-6 md:px-8"
      }
    }
    
    // Calculate max-width based on prop
    const getMaxWidth = () => {
      switch (maxWidth) {
        case "xs":
          return "max-w-xs"
        case "sm":
          return "max-w-screen-sm"
        case "md":
          return "max-w-screen-md"  
        case "lg":
          return "max-w-screen-lg"
        case "xl":
          return "max-w-screen-xl"
        case "2xl":
          return "max-w-screen-2xl"
        case "full":
          return "max-w-full"
        case "none":
          return ""
        default:
          return "max-w-screen-xl"
      }
    }

    return (
      <Component
        ref={ref}
        className={cn(
          getMaxWidth(),
          getPadding(),
          centered && "mx-auto",
          "w-full",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ResponsiveContainer.displayName = "ResponsiveContainer"

export { ResponsiveContainer }
