import React, { useEffect, useRef, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  speed?: number
  offset?: number
  fadeIn?: boolean
  scale?: boolean
  rotate?: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className,
  speed = 0.5,
  offset = 0,
  fadeIn = true,
  scale = false,
  rotate = false,
  direction = 'up'
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const scrollY = window.scrollY
      const elementTop = sectionRef.current.offsetTop
      const elementHeight = sectionRef.current.offsetHeight
      const windowHeight = window.innerHeight

      // Calculate the parallax offset based on scroll position
      const scrollProgress = (scrollY - elementTop + windowHeight) / (elementHeight + windowHeight)
      const parallaxOffset = (scrollProgress - 0.5) * 100 * speed

      // Apply transformations based on props
      let transform = ''

      switch (direction) {
        case 'up':
          transform = `translateY(${parallaxOffset + offset}px)`
          break
        case 'down':
          transform = `translateY(${-parallaxOffset + offset}px)`
          break
        case 'left':
          transform = `translateX(${parallaxOffset + offset}px)`
          break
        case 'right':
          transform = `translateX(${-parallaxOffset + offset}px)`
          break
      }

      if (scale) {
        const scaleValue = 1 + (scrollProgress - 0.5) * 0.2
        transform += ` scale(${Math.max(0.8, Math.min(1.2, scaleValue))})`
      }

      if (rotate) {
        const rotateValue = (scrollProgress - 0.5) * 10
        transform += ` rotate(${rotateValue}deg)`
      }

      sectionRef.current.style.transform = transform

      if (fadeIn) {
        const opacity = Math.min(1, scrollProgress * 2)
        sectionRef.current.style.opacity = opacity.toString()
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [speed, offset, fadeIn, scale, rotate, direction])

  return (
    <div
      ref={(node) => {
        sectionRef.current = node
        ref(node)
      }}
      className={cn(
        'will-change-transform transition-transform duration-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export default ParallaxSection