import React, { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LiquidTransitionProps {
  children: ReactNode
  className?: string
  duration?: number
  delay?: number
  type?: 'morph' | 'wave' | 'ripple' | 'dissolve'
  trigger?: boolean
  onTransitionEnd?: () => void
}

const LiquidTransition: React.FC<LiquidTransitionProps> = ({
  children,
  className,
  duration = 1000,
  delay = 0,
  type = 'morph',
  trigger = true,
  onTransitionEnd
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (trigger) {
      setTimeout(() => {
        setIsTransitioning(true)
        setIsVisible(true)
      }, delay)

      setTimeout(() => {
        setIsTransitioning(false)
        if (onTransitionEnd) {
          onTransitionEnd()
        }
      }, delay + duration)
    }
  }, [trigger, delay, duration, onTransitionEnd])

  const getAnimationClass = () => {
    switch (type) {
      case 'morph':
        return cn(
          'transition-all ease-in-out',
          isTransitioning && 'animate-liquid-morph'
        )
      case 'wave':
        return cn(
          'transition-all ease-in-out',
          isTransitioning && 'animate-liquid-wave'
        )
      case 'ripple':
        return cn(
          'transition-all ease-in-out',
          isTransitioning && 'animate-liquid-ripple'
        )
      case 'dissolve':
        return cn(
          'transition-opacity ease-in-out',
          isTransitioning && 'animate-liquid-dissolve'
        )
      default:
        return ''
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        getAnimationClass(),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Liquid effect overlay */}
      {isTransitioning && type === 'morph' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%,
              rgba(139, 92, 246, 0.3) 0%,
              rgba(59, 130, 246, 0.2) 50%,
              rgba(6, 182, 212, 0.1) 100%)`,
            filter: 'blur(40px)',
            animation: `liquid-morph ${duration}ms ease-in-out`,
          }}
        />
      )}

      {/* Wave effect */}
      {isTransitioning && type === 'wave' && (
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="fill-current text-blue-500/20"
              style={{
                animation: `wave ${duration}ms ease-in-out`,
              }}
            />
          </svg>
        </div>
      )}

      {/* Ripple effect */}
      {isTransitioning && type === 'ripple' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center,
              transparent 0%,
              rgba(139, 92, 246, 0.2) 25%,
              transparent 50%)`,
            animation: `ripple-expand ${duration}ms ease-out`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default LiquidTransition