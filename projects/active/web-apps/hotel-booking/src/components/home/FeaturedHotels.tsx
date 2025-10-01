import React from 'react'
import { Star, MapPin, Wifi, Car, Coffee, Waves } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

const FeaturedHotels = () => {
  const featuredHotels = [
    {
      id: '1',
      name: 'The Grand Palazzo',
      location: 'Venice, Italy',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=800&auto=format',
      rating: 4.8,
      reviews: 2847,
      pricePerNight: 350,
      originalPrice: 420,
      amenities: ['Wifi', 'Pool', 'Spa', 'Restaurant'],
      featured: true,
    },
    {
      id: '2',
      name: 'Skyline Boutique Hotel',
      location: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format',
      rating: 4.6,
      reviews: 1523,
      pricePerNight: 280,
      originalPrice: 340,
      amenities: ['Wifi', 'Gym', 'Bar', 'Rooftop'],
      featured: false,
    },
    {
      id: '3',
      name: 'Ocean View Resort',
      location: 'Maldives',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format',
      rating: 4.9,
      reviews: 967,
      pricePerNight: 650,
      originalPrice: 750,
      amenities: ['Wifi', 'Beach', 'Spa', 'Water Sports'],
      featured: true,
    },
    {
      id: '4',
      name: 'Mountain Lodge Retreat',
      location: 'Swiss Alps, Switzerland',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=800&auto=format',
      rating: 4.7,
      reviews: 634,
      pricePerNight: 450,
      originalPrice: 520,
      amenities: ['Wifi', 'Fireplace', 'Ski Access', 'Restaurant'],
      featured: false,
    },
  ]

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />
      case 'pool':
      case 'spa':
        return <Waves className="w-4 h-4" />
      case 'gym':
      case 'parking':
        return <Car className="w-4 h-4" />
      default:
        return <Coffee className="w-4 h-4" />
    }
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl  font-bold text-gray-900 mb-4">
          Featured Hotels
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our handpicked selection of exceptional hotels offering
          unique experiences and outstanding service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredHotels.map((hotel) => (
          <Card
            key={hotel.id}
            className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hotel-card"
          >
            <div className="relative overflow-hidden">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-48 object-cover hotel-image"
              />
              {hotel.featured && (
                <Badge
                  variant="premium"
                  className="absolute top-3 left-3 z-10"
                >
                  Featured
                </Badge>
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{hotel.rating}</span>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-vibe-blue-600 transition-colors">
                  {hotel.name}
                </h3>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  {hotel.location}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                <span>{hotel.reviews} reviews</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {hotel.amenities.slice(0, 3).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600"
                  >
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
                {hotel.amenities.length > 3 && (
                  <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                    +{hotel.amenities.length - 3} more
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-vibe-blue-600">
                      {formatCurrency(hotel.pricePerNight)}
                    </span>
                    {hotel.originalPrice > hotel.pricePerNight && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(hotel.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">per night</span>
                </div>
                <Button
                  size="sm"
                  className="bg-vibe-blue-600 hover:bg-vibe-blue-700"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          size="lg"
          className="border-vibe-blue-600 text-vibe-blue-600 hover:bg-vibe-blue-600 hover:text-white"
        >
          View All Hotels
        </Button>
      </div>
    </div>
  )
}

export default FeaturedHotels