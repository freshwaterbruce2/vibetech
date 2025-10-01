import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Text3D, Environment, MeshDistortMaterial, Sphere, useTexture } from '@react-three/drei'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '@/contexts/ThemeContext'
import { Search, MapPin, Calendar, Star, Play, Pause, VolumeX, Volume2, ChevronDown, Globe, Sparkles } from 'lucide-react'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// Professional 3D Scene Component
const HeroScene3D = ({ mousePosition }: { mousePosition: { x: number; y: number } }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (meshRef.current && groupRef.current) {
      // Smooth mouse-following rotation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mousePosition.y * 0.1,
        0.02
      )
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mousePosition.x * 0.1,
        0.02
      )

      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#8B5CF6"
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </Float>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <Float key={i} speed={2 + Math.random()} rotationIntensity={0.5}>
          <Sphere
            args={[0.02, 8, 8]}
            position={[
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10
            ]}
          >
            <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.5} />
          </Sphere>
        </Float>
      ))}

      <Environment preset="studio" />
    </group>
  )
}

// Cinematic Video Component
const CinematicVideo = ({ isPlaying, isMuted, onPlayToggle, onMuteToggle }: {
  isPlaying: boolean
  isMuted: boolean
  onPlayToggle: () => void
  onMuteToggle: () => void
}) => {
  const videoRef = useRef<HTMLVideoElement>(null!)

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-105"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&h=1080&fit=crop"
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-luxury-resort-in-the-maldives-2240-large.mp4" type="video/mp4" />
        <source src="https://assets.mixkit.co/videos/preview/mixkit-luxury-hotel-room-with-a-view-4065-large.mp4" type="video/mp4" />
      </video>

      {/* Video Controls */}
      <div className="absolute bottom-8 right-8 z-20 flex gap-3">
        <button
          onClick={onPlayToggle}
          className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/30 transition-all duration-300"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={onMuteToggle}
          className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/30 transition-all duration-300"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/20 via-transparent to-[#06B6D4]/20" />
    </div>
  )
}

// Luxury Statistics Component
const LuxuryStats = () => {
  const [counters, setCounters] = useState({
    hotels: 0,
    destinations: 0,
    bookings: 0,
    guests: 0
  })

  const targetValues = {
    hotels: 50000,
    destinations: 195,
    bookings: 12847,
    guests: 5000000
  }

  useEffect(() => {
    const duration = 3000
    const steps = 60
    const interval = duration / steps

    Object.keys(targetValues).forEach((key) => {
      const target = targetValues[key as keyof typeof targetValues]
      const increment = target / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setCounters(prev => ({ ...prev, [key]: Math.floor(current) }))
      }, interval)
    })
  }, [])

  const stats = [
    { icon: Star, label: 'Luxury Properties', value: counters.hotels, suffix: '+', color: 'text-yellow-400' },
    { icon: Globe, label: 'Countries', value: counters.destinations, suffix: '', color: 'text-blue-400' },
    { icon: Calendar, label: 'Bookings Today', value: counters.bookings, suffix: '', color: 'text-green-400' },
    { icon: MapPin, label: 'Happy Guests', value: counters.guests, suffix: '+', color: 'text-purple-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="text-center group"
          >
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="text-3xl lg:text-4xl font-black text-white mb-2 font-mono">
              {stat.value.toLocaleString()}{stat.suffix}
            </div>
            <div className="text-sm text-white/70 font-medium tracking-wider uppercase">
              {stat.label}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Main Hero Component
const WorldClassHero: React.FC = () => {
  const { isDarkMode } = useTheme()
  const heroRef = useRef<HTMLDivElement>(null!)
  const titleRef = useRef<HTMLHeadingElement>(null!)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  // Mouse tracking for 3D interaction
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      setMousePosition({ x, y })
    }
  }, [])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // GSAP animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo('.hero-title-line',
      { y: 150, opacity: 0, rotateX: -90 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.2 }
    )
    .fromTo('.hero-subtitle',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      '-=0.6'
    )
    .fromTo('.hero-cta',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' },
      '-=0.3'
    )

    return () => tl.kill()
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <HeroScene3D mousePosition={mousePosition} />
        </Canvas>
      </div>

      {/* Cinematic Video Background */}
      <motion.div style={{ scale }} className="absolute inset-0 z-1">
        <CinematicVideo
          isPlaying={isVideoPlaying}
          isMuted={isVideoMuted}
          onPlayToggle={() => setIsVideoPlaying(!isVideoPlaying)}
          onMuteToggle={() => setIsVideoMuted(!isVideoMuted)}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20"
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Live Clock */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 text-white/60 text-sm font-mono tracking-widest"
          >
            {currentTime.toLocaleString('en-US', {
              timeZone: 'UTC',
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })} UTC
          </motion.div>

          {/* Main Title */}
          <div className="mb-12 perspective-1000">
            <h1 ref={titleRef} className="font-black leading-none">
              <div className="hero-title-line text-6xl md:text-8xl lg:text-9xl mb-4">
                <span className="inline-block bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Luxury
                </span>
              </div>
              <div className="hero-title-line text-7xl md:text-9xl lg:text-[12rem]">
                <span className="inline-block bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">
                  VibeStay
                </span>
              </div>
            </h1>

            <motion.p
              className="hero-subtitle text-xl md:text-3xl lg:text-4xl text-white/90 mt-8 font-light tracking-wide max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Where Extraordinary Journeys Begin
            </motion.p>
          </div>

          {/* Luxury Statistics */}
          <LuxuryStats />

          {/* CTA Section */}
          <motion.div
            className="hero-cta flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <button className="group relative px-12 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-2xl text-white font-semibold text-lg overflow-hidden">
              <span className="relative z-10 flex items-center">
                <Search className="w-5 h-5 mr-3" />
                Explore Destinations
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>

            <button className="px-12 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300">
              <Sparkles className="w-5 h-5 mr-3 inline" />
              Curated Experiences
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            {[
              'Verified Luxury Properties',
              'Instant Confirmation',
              'Concierge Service',
              '24/7 Global Support'
            ].map((feature, i) => (
              <div key={i} className="flex items-center">
                <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full mr-3" />
                {feature}
              </div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-8 h-14 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
            </div>
            <ChevronDown className="w-6 h-6 text-white/60 mx-auto mt-2" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default WorldClassHero