
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Detect if we're running in a browser environment
export const isBrowser = typeof window !== 'undefined'

// Screen size helpers
export const getScreenSize = () => {
  if (!isBrowser) return { width: 0, height: 0, isPortrait: true }
  
  const width = window.innerWidth
  const height = window.innerHeight
  const isPortrait = height > width
  
  return { width, height, isPortrait }
}

// Check if the device is touch-capable
export const isTouchDevice = () => {
  if (!isBrowser) return false
  
  return ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0) || 
    // @ts-expect-error - some browsers support this
    (navigator.msMaxTouchPoints > 0)
}

// Safe window sizing with fallbacks and reactivity handling
export const safeWindow = {
  get width() {
    return isBrowser ? window.innerWidth : 0
  },
  get height() {
    return isBrowser ? window.innerHeight : 0 
  },
  get scrollY() {
    return isBrowser ? window.scrollY : 0
  }
}
