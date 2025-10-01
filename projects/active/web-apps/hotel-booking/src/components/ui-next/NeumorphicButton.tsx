import React, { forwardRef, ButtonHTMLAttributes, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface NeumorphicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'raised' | 'inset' | 'gradient' | 'glow'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  magnetic?: boolean
  ripple?: boolean
  pulse?: boolean
}

const NeumorphicButton = forwardRef<HTMLButtonElement, NeumorphicButtonProps>(
  ({
    className,
    variant = 'raised',
    size = 'md',
    magnetic = false,
    ripple = true,
    pulse = false,
    children,
    onClick,
    ...props
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false)
    const [magneticPosition, setMagneticPosition] = useState({ x: 0, y: 0 })
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const buttonRef = useRef<HTMLButtonElement>(null)

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-10 py-5 text-xl'
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !buttonRef.current) return

      const rect = buttonRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const magneticStrength = 0.3
      const magneticRange = 100

      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

      if (distance < magneticRange) {
        const pullX = (distanceX * magneticStrength * (1 - distance / magneticRange))
        const pullY = (distanceY * magneticStrength * (1 - distance / magneticRange))
        setMagneticPosition({ x: pullX, y: pullY })
      }
    }

    const handleMouseLeave = () => {
      setMagneticPosition({ x: 0, y: 0 })
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newRipple = { x, y, id: Date.now() }

        setRipples(prev => [...prev, newRipple])

        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id))
        }, 1000)
      }

      if (onClick) {
        onClick(e)
      }
    }

    const baseClasses = cn(
      'relative',
      'font-semibold',
      'rounded-xl',
      'transition-all duration-300',
      'transform-gpu',
      'will-change-transform',
      'select-none',
      'overflow-hidden',
      sizeClasses[size]
    )

    const variantClasses = {
      raised: cn(
        'bg-gradient-to-br from-[var(--vs-dark-elevated)] to-[var(--vs-dark-surface)]',
        'shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.05)]',
        'hover:shadow-[12px_12px_20px_rgba(0,0,0,0.5),-12px_-12px_20px_rgba(255,255,255,0.07)]',
        'active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]'
      ),
      inset: cn(
        'bg-gradient-to-br from-[var(--vs-dark-surface)] to-[var(--vs-dark-elevated)]',
        'shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]',
        'hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.07)]'
      ),
      gradient: cn(
        'bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4]',
        'shadow-[0_8px_32px_rgba(139,92,246,0.4)]',
        'hover:shadow-[0_12px_48px_rgba(139,92,246,0.6)]',
        'hover:scale-105',
        'text-white'
      ),
      glow: cn(
        'bg-gradient-to-br from-[var(--vs-dark-elevated)] to-[var(--vs-dark-surface)]',
        'shadow-[0_0_20px_rgba(0,255,224,0.5),0_0_40px_rgba(0,255,224,0.3)]',
        'hover:shadow-[0_0_30px_rgba(0,255,224,0.7),0_0_60px_rgba(0,255,224,0.4)]',
        'border border-[var(--vs-neon-cyan)]/30'
      )
    }

    return (
      <button
        ref={(node) => {
          buttonRef.current = node
          if (ref) {
            if (typeof ref === 'function') {
              ref(node)
            } else {
              ref.current = node
            }
          }
        }}
        className={cn(
          baseClasses,
          variantClasses[variant],
          pulse && 'animate-pulse',
          className
        )}
        style={{
          transform: `translate(${magneticPosition.x}px, ${magneticPosition.y}px)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Gradient overlay for gradient variant */}
        {variant === 'gradient' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        )}

        {/* Content */}
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)

NeumorphicButton.displayName = 'NeumorphicButton'

export default NeumorphicButton