import React, { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'inset'
  glow?: boolean
  glowColor?: 'cyan' | 'purple' | 'blue' | 'gradient'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  borderWidth?: 'thin' | 'normal' | 'thick'
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    className,
    variant = 'default',
    glow = false,
    glowColor = 'gradient',
    blur = 'md',
    borderWidth = 'normal',
    children,
    ...props
  }, ref) => {
    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl'
    }

    const borderClasses = {
      thin: 'border',
      normal: 'border-2',
      thick: 'border-4'
    }

    const glowClasses = {
      cyan: 'neon-glow-cyan',
      purple: 'neon-glow-purple',
      blue: 'neon-glow-blue',
      gradient: ''
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-white/5 dark:bg-black/20',
          blurClasses[blur],
          borderClasses[borderWidth],
          'border-white/10 dark:border-white/5',
          'shadow-xl',
          'transition-all duration-500 ease-out',
          'hover:bg-white/10 dark:hover:bg-black/30',
          'hover:border-white/20 dark:hover:border-white/10',
          'hover:shadow-2xl',
          'hover:scale-[1.02]',
          glow && glowClasses[glowColor],
          variant === 'elevated' && 'transform translate-y-0 hover:-translate-y-1',
          variant === 'inset' && 'shadow-inner',
          className
        )}
        {...props}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

        {/* Animated gradient border on hover */}
        {glow && glowColor === 'gradient' && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-[-2px] bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4] rounded-2xl blur-lg" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export default GlassCard