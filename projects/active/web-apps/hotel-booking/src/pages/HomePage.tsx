import React from 'react'
import { motion } from 'framer-motion'
import EnhancedHeroSection from '@/components/home/EnhancedHeroSection'
import SearchForm from '@/components/search/SearchForm'
import FeaturedHotels from '@/components/home/FeaturedHotels'
import PopularDestinations from '@/components/home/PopularDestinations'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import TestimonialsSection from '@/components/home/TestimonialsSection'

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Search */}
      <section className="relative min-h-screen bg-gradient-to-br from-vibe-blue-900 via-vibe-blue-700 to-vibe-purple-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Hero Content */}
        <EnhancedHeroSection />

        {/* Search Form Overlay */}
        <div id="search-section" className="absolute bottom-0 left-0 right-0 transform translate-y-1/2 z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="max-w-6xl mx-auto"
            >
              <SearchForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="pt-24">
        {/* Featured Hotels */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FeaturedHotels />
            </motion.div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <PopularDestinations />
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <WhyChooseUs />
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <TestimonialsSection />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-vibe-blue-600 to-vibe-purple-600">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl  font-bold text-white mb-6">
                Ready to Find Your Perfect Stay?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join millions of travelers who trust Vibe Bookings for their accommodation needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-white text-vibe-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                  Start Searching
                </button>
                <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-vibe-blue-600 transition-colors">
                  Download App
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage