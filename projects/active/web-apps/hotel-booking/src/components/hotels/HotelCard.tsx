import React from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Wifi, Car, Dumbbell, Coffee, Heart, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Hotel, RoomOffer, HotelSearchRequest } from '@/types/liteapi'

interface HotelCardProps {
  hotel: Hotel
  offer: RoomOffer
  viewMode: 'grid' | 'list' | 'map'
  searchRequest: HotelSearchRequest
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, offer, viewMode, searchRequest }) => {
  const nights = React.useMemo(() => {
    const checkIn = new Date(searchRequest.checkIn)
    const checkOut = new Date(searchRequest.checkOut)
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }, [searchRequest])

  const pricePerNight = offer.pricing.totalPrice / nights
  const totalPrice = offer.pricing.totalPrice

  // Get main image
  const mainImage = hotel.images.find(img => img.category === 'main') || hotel.images[0]

  // Get key amenities for display
  const keyAmenities = hotel.amenities.slice(0, 4).map(amenity => {
    const iconMap: Record<string, React.ReactNode> = {
      wifi: <Wifi className="w-4 h-4" />,
      parking: <Car className="w-4 h-4" />,
      fitness: <Dumbbell className="w-4 h-4" />,
      restaurant: <Coffee className="w-4 h-4" />,
    }
    return {
      ...amenity,
      icon: iconMap[amenity.category] || <MapPin className="w-4 h-4" />
    }
  })

  // Render stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (viewMode === 'list') {
    return (
      <Card className="hotel-card overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Image */}
            <div className="w-64 h-48 flex-shrink-0 relative">
              <img
                src={mainImage?.url || '/api/placeholder/300/200'}
                alt={hotel.name}
                className="hotel-image w-full h-full object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <Heart className="w-4 h-4" />
              </Button>
              {offer.ratePlan.refundable && (
                <Badge className="absolute bottom-3 left-3 bg-green-600">
                  Free Cancellation
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      <Link to={`/hotel/${hotel.id}`}>
                        {hotel.name}
                      </Link>
                    </h3>
                    <div className="flex">{renderStars(hotel.starRating)}</div>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {hotel.address.city}, {hotel.address.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                      {hotel.guestRating.overall.toFixed(1)}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({hotel.guestRating.totalReviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalPrice, offer.pricing.currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(pricePerNight, offer.pricing.currency)} per night
                  </div>
                  {offer.pricing.taxes.length > 0 && (
                    <div className="text-xs text-gray-500">
                      + taxes & fees
                    </div>
                  )}
                </div>
              </div>

              {/* Room details */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">{offer.roomType.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{offer.roomType.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>Max {offer.roomType.maxOccupancy} guests</span>
                  <span>•</span>
                  <span>{offer.ratePlan.mealPlan.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className={offer.ratePlan.paymentType === 'pay_now' ? 'text-green-600' : 'text-orange-600'}>
                    {offer.ratePlan.paymentType === 'pay_now' ? 'Pay Now' : 'Pay Later'}
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {keyAmenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-1 text-gray-600">
                      {amenity.icon}
                      <span className="text-xs">{amenity.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/hotel/${hotel.id}`}>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Details
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/booking/${hotel.id}/${offer.offerId}`}>
                      Book Now
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view (default)
  return (
    <Card className="hotel-card overflow-hidden">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative h-48">
          <img
            src={mainImage?.url || '/api/placeholder/400/200'}
            alt={hotel.name}
            className="hotel-image w-full h-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Heart className="w-4 h-4" />
          </Button>
          {offer.ratePlan.refundable && (
            <Badge className="absolute bottom-3 left-3 bg-green-600">
              Free Cancellation
            </Badge>
          )}
          <div className="absolute top-3 left-3 flex">{renderStars(hotel.starRating)}</div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
              <Link to={`/hotel/${hotel.id}`}>
                {hotel.name}
              </Link>
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm line-clamp-1">
                {hotel.address.city}, {hotel.address.country}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                {hotel.guestRating.overall.toFixed(1)}
              </div>
              <span className="text-sm text-gray-600">
                ({hotel.guestRating.totalReviews})
              </span>
            </div>
          </div>

          {/* Room details */}
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{offer.roomType.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <span>Max {offer.roomType.maxOccupancy}</span>
              <span>•</span>
              <span>{offer.ratePlan.mealPlan.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex items-center gap-2 mb-4">
            {keyAmenities.slice(0, 3).map((amenity, index) => (
              <div key={index} className="flex items-center gap-1 text-gray-600">
                {amenity.icon}
              </div>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="text-xs text-gray-500">+{hotel.amenities.length - 3} more</span>
            )}
          </div>

          {/* Price and booking */}
          <div className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalPrice, offer.pricing.currency)}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(pricePerNight, offer.pricing.currency)} per night
              </div>
              {offer.pricing.taxes.length > 0 && (
                <div className="text-xs text-gray-500">+ taxes</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/hotel/${hotel.id}`}>Details</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/booking/${hotel.id}/${offer.offerId}`}>Book</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default HotelCard