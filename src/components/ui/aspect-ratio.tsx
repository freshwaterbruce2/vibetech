
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { cn } from "@/lib/utils"
import React from "react"

interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  /**
   * The ratio of the width to the height of the element.
   * @example 16 / 9 (for a typical video)
   * @example 1 / 1 (for a square)
   * @example 4 / 3 (for a traditional photo)
   */
  ratio?: number
  /**
   * The content to be rendered within the aspect ratio container
   */
  children?: React.ReactNode
  /**
   * Additional className for the component
   */
  className?: string
}

/**
 * AspectRatio component constrains elements to a specified aspect ratio
 * 
 * @example
 * <AspectRatio ratio={16/9} className="bg-muted">
 *   <img src="..." alt="..." className="object-cover" />
 * </AspectRatio>
 */
const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ className, ratio = 1, ...props }, ref) => (
  <AspectRatioPrimitive.Root 
    ref={ref}
    ratio={ratio}
    className={cn(className)}
    {...props}
  />
))
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }
