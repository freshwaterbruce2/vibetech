import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Search, Menu, X, User, MapPin, Calendar, Moon, Sun, Globe,
  Sparkles, Bell, Heart, Settings, LogOut, CreditCard, Shield,
  Compass, Star, Gift, Phone, ChevronDown
} from 'lucide-react'

const LiquidGlassNavigation: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const navRef = useRef<HTMLElement>(null)

  const { scrollY } = useScroll()
  const navOpacity = useTransform(scrollY, [0, 100], [0.8, 0.95])
  const navBlur = useTransform(scrollY, [0, 100], [10, 20])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (navRef.current) {
      const rect = navRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const navItems = [
    {
      label: 'Destinations',
      href: '/destinations',
      icon: Compass,
      description: 'Discover luxury worldwide'
    },
    {
      label: 'Experiences',
      href: '/experiences',
      icon: Sparkles,
      description: 'Curated luxury experiences'
    },
    {
      label: 'Collections',
      href: '/collections',
      icon: Star,
      description: 'Handpicked properties'
    },
    {
      label: 'Concierge',
      href: '/concierge',
      icon: Gift,
      description: 'Personal travel assistant'
    }
  ]

  const userMenuItems = [
    { label: 'My Profile', icon: User, href: '/profile' },
    { label: 'My Bookings', icon: Calendar, href: '/bookings' },
    { label: 'Favorites', icon: Heart, href: '/favorites' },
    { label: 'Wallet', icon: CreditCard, href: '/wallet' },
    { label: 'Notifications', icon: Bell, href: '/notifications', badge: '3' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Support', icon: Phone, href: '/support' },
  ]

  return (
    <motion.nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: `rgba(10, 10, 15, ${scrolled ? 0.95 : 0.8})`,
        backdropFilter: `blur(${scrolled ? 20 : 10}px)`,
        borderBottom: `1px solid rgba(255, 255, 255, ${scrolled ? 0.1 : 0.05})`
      }}
      onMouseMove={handleMouseMove}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'power3.out' }}
    >
      {/* Liquid Glass Effect Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.05), transparent 40%)`
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group flex items-center space-x-3">
            <motion.div
              className="relative w-12 h-12 rounded-xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4]" />
              <div className="absolute inset-0 bg-gradient-to-tl from-white/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-black text-lg">VS</span>
              </div>
            </motion.div>

            <div className="hidden sm:block">
              <div className="text-xl font-black text-white">VibeStay</div>
              <div className="text-xs text-white/60 tracking-widest font-medium">BY VIBE-TECH</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.href)

              return (
                <motion.div key={item.href} className="relative group">
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>

                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/80 backdrop-blur-md rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                    {item.description}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45" />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <motion.button
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all duration-300 border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search size={16} />
              <span className="text-sm">Search</span>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘K</kbd>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {/* Language */}
            <motion.button
              className="hidden md:flex p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Globe size={18} />
            </motion.button>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <ChevronDown size={14} className={`text-white/60 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* User Dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">Guest User</div>
                          <div className="text-white/60 text-sm">Sign in for full access</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {userMenuItems.map((item, index) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="flex items-center space-x-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Icon size={18} />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-1 bg-[#8B5CF6] text-white text-xs rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 border-t border-white/10">
                      <button className="flex items-center space-x-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/10 mt-4 pt-4 pb-6"
            >
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon size={20} />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-white/60">{item.description}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background click handler */}
      {(isMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setIsMenuOpen(false)
            setIsUserMenuOpen(false)
          }}
        />
      )}
    </motion.nav>
  )
}

export default LiquidGlassNavigation