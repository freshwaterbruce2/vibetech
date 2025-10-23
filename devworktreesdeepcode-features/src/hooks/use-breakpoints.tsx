
import * as React from "react";

// Define breakpoints that match Tailwind's default breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export type Breakpoint = keyof typeof breakpoints;

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`);
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };
    
    // Set initial state
    handleChange(mql);
    
    // Modern event listener pattern
    mql.addEventListener("change", handleChange);
    
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, [breakpoint]);

  return matches;
}

export function useBreakpoints() {
  const isSm = useBreakpoint("sm");
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  const isXl = useBreakpoint("xl");
  const is2xl = useBreakpoint("2xl");

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    // Derived helpers
    isMobile: !isMd, // anything below md breakpoint
    isTablet: isMd && !isLg,
    isDesktop: isLg,
    isLargeDesktop: isXl,
    current: is2xl ? "2xl" : isXl ? "xl" : isLg ? "lg" : isMd ? "md" : isSm ? "sm" : "xs",
  };
}
