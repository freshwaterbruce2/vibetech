import React from 'react'
import { Shield, Clock, Award, Headphones } from 'lucide-react'

const WhyChooseUs = () => {
  const features = [
    {
      icon: Shield,
      title: 'Best Price Guarantee',
      description: 'Find a lower price? We\'ll match it and give you an extra 10% off.',
    },
    {
      icon: Clock,
      title: 'Free Cancellation',
      description: 'Plans change. Cancel up to 24 hours before check-in with no fees.',
    },
    {
      icon: Award,
      title: 'Verified Reviews',
      description: 'Real reviews from verified guests to help you make the right choice.',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our customer service team is here to help you anytime, anywhere.',
    },
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl  font-bold text-gray-900 mb-4">
          Why Choose Vibe Bookings?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We're committed to making your travel planning as easy and enjoyable as your trip itself.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-vibe-blue-100 to-vibe-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-vibe-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WhyChooseUs