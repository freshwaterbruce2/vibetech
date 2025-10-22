
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }
    
    // Set initial state
    onChange(mql)
    
    // Use the modern event listener API
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false as default if undefined (during SSR)
  return isMobile ?? false
}

// Additional utility for portrait/landscape detection
export function useIsPortrait() {
  const [isPortrait, setIsPortrait] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia("(orientation: portrait)")
    
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsPortrait(e.matches)
    }
    
    // Set initial state
    onChange(mql)
    
    // Use the modern event listener API
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return true as default if undefined (during SSR)
  return isPortrait ?? true
}

// Helper to get device type
export function useDeviceType() {
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  
  return {
    isMobile,
    isPortrait,
    isLandscape: !isPortrait,
    isDesktop: !isMobile
  }
}
