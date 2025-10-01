import React from 'react'
import { Card } from '@/components/ui/card'

const PopularDestinations = () => {
  const destinations = [
    {
      name: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?q=80&w=400&auto=format',
      hotels: 1250,
    },
    {
      name: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format',
      hotels: 890,
    },
    {
      name: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400&auto=format',
      hotels: 2100,
    },
    {
      name: 'London, UK',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&auto=format',
      hotels: 1650,
    },
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl  font-bold text-gray-900 mb-4">
          Popular Destinations
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore the world's most beloved travel destinations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {destinations.map((destination) => (
          <Card key={destination.name} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={destination.image}
                alt={destination.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">{destination.name}</h3>
                <p className="text-sm opacity-90">{destination.hotels} hotels</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PopularDestinations