import React, { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  separator?: string
  animateOnScroll?: boolean
  easing?: 'linear' | 'easeOut' | 'easeIn' | 'easeInOut'
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  separator = ',',
  animateOnScroll = true,
  easing = 'easeOut'
}) => {
  const [count, setCount] = useState(from)
  const [hasAnimated, setHasAnimated] = useState(false)
  const countRef = useRef(from)
  const frameRef = useRef<number>()
  const startTimeRef = useRef<number>()

  const [ref, inView] = useInView({
    threshold: 0.5,
    triggerOnce: true,
  })

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeIn: (t: number) => Math.pow(t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2,
  }

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    if (separator) {
      const parts = fixed.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      return parts.join('.')
    }
    return fixed
  }

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp
    }

    const elapsed = timestamp - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easingFunctions[easing](progress)

    const currentCount = from + (to - from) * easedProgress
    countRef.current = currentCount
    setCount(currentCount)

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate)
    } else {
      setHasAnimated(true)
    }
  }

  useEffect(() => {
    const shouldAnimate = animateOnScroll ? inView && !hasAnimated : !hasAnimated

    if (shouldAnimate) {
      startTimeRef.current = undefined
      frameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [inView, animateOnScroll, hasAnimated, from, to, duration, easing])

  return (
    <span
      ref={ref}
      className={cn(
        'inline-block font-bold tabular-nums',
        'bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4]',
        'bg-clip-text text-transparent',
        'animate-pulse',
        className
      )}
    >
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  )
}

export default AnimatedCounter