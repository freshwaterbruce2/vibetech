import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, Stars, Cloud } from '@react-three/drei'
import { motion, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GlassCard, NeumorphicButton, AnimatedCounter, ParallaxSection } from '@/components/ui-next'
import { Sparkles, Search, MapPin, Calendar, Users, Star, ChevronDown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

// 3D Background Component
const Background3D = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Float speed={0.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Cloud
            position={[-4, -2, -10]}
            speed={0.2}
            opacity={0.1}
            color="#8B5CF6"
          />
          <Cloud
            position={[4, 2, -5]}
            speed={0.2}
            opacity={0.1}
            color="#06B6D4"
          />
        </Float>
      </Canvas>
    </div>
  )
}

const EnhancedHeroSection: React.FC = () => {
  const { isDarkMode } = useTheme()
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    // GSAP Timeline for initial animations
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', duration: 1 }
    })

    tl.fromTo('.hero-title',
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.2 }
    )
    .fromTo('.hero-subtitle',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      '-=0.5'
    )
    .fromTo('.hero-stats',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1 },
      '-=0.3'
    )
    .fromTo('.hero-cta',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      '-=0.2'
    )

    // Floating animation for decorative elements
    gsap.to('.float-element', {
      y: 'random(-20, 20)',
      x: 'random(-10, 10)',
      rotation: 'random(-15, 15)',
      duration: 'random(3, 5)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: {
        amount: 1,
        from: 'random'
      }
    })

    return () => {
      tl.kill()
    }
  }, [])

  const stats = [
    { icon: Star, label: 'Luxury Hotels', value: 50000, suffix: '+' },
    { icon: MapPin, label: 'Destinations', value: 195, suffix: ' Countries' },
    { icon: Calendar, label: 'Bookings Today', value: 12847, suffix: '' },
    { icon: Users, label: 'Happy Guests', value: 5000000, suffix: '+' },
  ]

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden aurora-bg">
      {/* 3D Background */}
      <Background3D />

      {/* Video Background (Optional) */}
      <div className="absolute inset-0 z-1">
        <video
          className="w-full h-full object-cover opacity-20"
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--vs-dark-base)]/80 via-[var(--vs-dark-base)]/50 to-[var(--vs-dark-base)]" />
      </div>

      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 z-2"
        style={{ y, opacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 via-transparent to-[#06B6D4]/20 animate-pulse" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto text-center">
          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="float-element absolute"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 2) * 40}%`,
                }}
              >
                <Sparkles className="w-6 h-6 text-[var(--vs-neon-cyan)]/30" />
              </div>
            ))}
          </div>

          {/* Main Title */}
          <motion.div className="mb-8">
            <h1 ref={titleRef} className="hero-title">
              <span className="block text-5xl md:text-7xl lg:text-8xl font-black mb-4">
                <span className="holographic">Welcome to</span>
              </span>
              <span className="block text-6xl md:text-8xl lg:text-9xl font-black">
                <span className="bg-gradient-to-r from-[var(--vs-gradient-start)] via-[var(--vs-gradient-mid)] to-[var(--vs-gradient-end)] bg-clip-text text-transparent animate-pulse">
                  VibeStay
                </span>
              </span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl lg:text-3xl text-white/80 mt-6 font-light">
              Where Every Journey Feels Like Home
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <GlassCard
                  key={index}
                  className="hero-stats p-6 hover:scale-105 transition-transform duration-300"
                  glow
                  glowColor="gradient"
                >
                  <Icon className="w-8 h-8 text-[var(--vs-neon-cyan)] mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white">
                    <AnimatedCounter
                      to={stat.value}
                      duration={2000}
                      separator=","
                      suffix={stat.suffix}
                    />
                  </div>
                  <p className="text-sm text-white/70 mt-1">{stat.label}</p>
                </GlassCard>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
            <NeumorphicButton
              variant="gradient"
              size="lg"
              magnetic
              ripple
              className="min-w-[200px]"
              onClick={() => {
                // Scroll to search form
                const searchSection = document.getElementById('search-section')
                searchSection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Search className="w-5 h-5 mr-2" />
              Start Exploring
            </NeumorphicButton>

            <NeumorphicButton
              variant="glow"
              size="lg"
              magnetic
              className="min-w-[200px]"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              View Experiences
            </NeumorphicButton>
          </div>

          {/* Trust Badges */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {['Best Price Guarantee', 'Instant Booking', 'Verified Properties', '24/7 Support'].map((badge, i) => (
              <div
                key={i}
                className="glass-effect px-4 py-2 rounded-full text-sm text-white/80 border border-white/10"
              >
                ✓ {badge}
              </div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="glass-effect p-3 rounded-full">
              <ChevronDown className="w-6 h-6 text-[var(--vs-neon-cyan)]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default EnhancedHeroSection