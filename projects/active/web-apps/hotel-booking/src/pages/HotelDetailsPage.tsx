import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  MapPin,
  Wifi,
  Car,
  UtensilsCrossed,
  Dumbbell,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Bed,
  Calendar,
  CreditCard,
  Shield,
  Info
} from 'lucide-react'
import { useHotelDetails } from '@/hooks/useLiteAPI'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ImageGallery from '@/components/hotels/ImageGallery'
import type { Hotel, Amenity, RoomOffer } from '@/types/liteapi'

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  restaurant: <UtensilsCrossed className="w-4 h-4" />,
  fitness: <Dumbbell className="w-4 h-4" />,
  pool: <div className="w-4 h-4 bg-blue-500 rounded" />,
  spa: <div className="w-4 h-4 bg-purple-500 rounded-full" />,
  business: <div className="w-4 h-4 bg-gray-500 rounded" />,
  pets: <div className="w-4 h-4 bg-yellow-500 rounded-full" />,
  accessibility: <div className="w-4 h-4 bg-green-500 rounded" />,
  family: <Users className="w-4 h-4" />,
  entertainment: <div className="w-4 h-4 bg-red-500 rounded" />,
  transportation: <Car className="w-4 h-4" />,
}

const HotelHeader: React.FC<{ hotel: Hotel }> = ({ hotel }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to search
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(hotel.starRating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              {hotel.chain && (
                <Badge variant="outline">{hotel.chain.name}</Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>

            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{hotel.address.street}, {hotel.address.city}, {hotel.address.country}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{hotel.guestRating.overall.toFixed(1)}</span>
                <span className="text-gray-600">({hotel.guestRating.totalReviews} reviews)</span>
              </div>

              {hotel.contact.phone && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{hotel.contact.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:text-right">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              From ${hotel.offers[0]?.pricing.basePrice || 0}
              <span className="text-sm font-normal text-gray-500">/night</span>
            </div>
            <Button size="lg" className="w-full lg:w-auto">
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AmenitiesList: React.FC<{ amenities: Amenity[] }> = ({ amenities }) => {
  if (!amenities.length) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {amenities.map((amenity) => (
        <div key={amenity.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          {amenityIcons[amenity.category] || <Info className="w-4 h-4" />}
          <span className="text-sm font-medium">{amenity.name}</span>
        </div>
      ))}
    </div>
  )
}

const RoomOfferCard: React.FC<{ offer: RoomOffer; onSelect: () => void }> = ({ offer, onSelect }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{offer.roomType.name}</h3>
            <p className="text-gray-600 mb-4">{offer.roomType.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Max {offer.roomType.maxOccupancy} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {offer.roomType.bedTypes.map(bed =>
                    `${bed.quantity} ${bed.type}`
                  ).join(', ')}
                </span>
              </div>
              {offer.roomType.roomSize && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded" />
                  <span className="text-sm">{offer.roomType.roomSize} sqm</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{offer.ratePlan.mealPlan.replace('_', ' ')}</Badge>
              <Badge variant={offer.ratePlan.refundable ? "default" : "secondary"}>
                {offer.ratePlan.refundable ? 'Refundable' : 'Non-refundable'}
              </Badge>
              <Badge variant="outline">{offer.ratePlan.paymentType.replace('_', ' ')}</Badge>
            </div>
          </div>

          <div className="lg:text-right">
            <div className="mb-2">
              <div className="text-2xl font-bold">${offer.pricing.totalPrice}</div>
              <div className="text-sm text-gray-500">per night</div>
              {offer.pricing.basePrice !== offer.pricing.totalPrice && (
                <div className="text-sm text-gray-500">
                  Base: ${offer.pricing.basePrice}
                </div>
              )}
            </div>

            {offer.availability.roomsLeft && offer.availability.roomsLeft <= 5 && (
              <p className="text-sm text-orange-600 mb-2">
                Only {offer.availability.roomsLeft} rooms left!
              </p>
            )}

            <Button onClick={onSelect} className="w-full lg:w-auto">
              Select Room
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const HotelDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: hotelDetails, isLoading, error } = useHotelDetails(id || '', !!id)

  const handleRoomSelect = (offerId: string) => {
    navigate(`/booking/${id}/${offerId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <Skeleton className="h-8 w-24 mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-6 w-96 mb-4" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !hotelDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Alert className="max-w-lg mx-auto">
            <AlertDescription>
              Failed to load hotel details. Please try again or go back to search.
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to search
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const hotel = hotelDetails.hotel

  return (
    <div className="min-h-screen bg-gray-50">
      <HotelHeader hotel={hotel} />

      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="mb-8">
          <ImageGallery images={hotel.images} hotelName={hotel.name} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About this hotel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-gray-500" />
                        <div>
                          <p className="font-medium">{hotel.address.street}</p>
                          <p className="text-gray-600">
                            {hotel.address.city}, {hotel.address.state && `${hotel.address.state}, `}
                            {hotel.address.country} {hotel.address.postalCode}
                          </p>
                        </div>
                      </div>

                      {hotelDetails.nearbyAttractions && hotelDetails.nearbyAttractions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Nearby attractions</h4>
                          <div className="space-y-2">
                            {hotelDetails.nearbyAttractions.slice(0, 5).map((attraction) => (
                              <div key={attraction.id} className="flex justify-between text-sm">
                                <span>{attraction.name}</span>
                                <span className="text-gray-500">
                                  {(attraction.distance / 1000).toFixed(1)} km
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hotel.contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{hotel.contact.phone}</span>
                        </div>
                      )}
                      {hotel.contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{hotel.contact.email}</span>
                        </div>
                      )}
                      {hotel.contact.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <a
                            href={hotel.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit website
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rooms" className="space-y-4">
                {hotel.offers.map((offer) => (
                  <RoomOfferCard
                    key={offer.offerId}
                    offer={offer}
                    onSelect={() => handleRoomSelect(offer.offerId)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="amenities">
                <Card>
                  <CardHeader>
                    <CardTitle>Hotel Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AmenitiesList amenities={hotel.amenities} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="policies" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Check-in & Check-out</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Check-in</h4>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {hotelDetails.policies?.checkin?.from} - {hotelDetails.policies?.checkin?.to}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Check-out</h4>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Before {hotelDetails.policies?.checkout?.before}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cancellation Policy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-1 text-gray-500" />
                      <div>
                        <p className="font-medium capitalize">
                          {hotel.cancellationPolicy.type.replace('_', ' ')} cancellation
                        </p>
                        <p className="text-gray-600 mt-1">{hotel.cancellationPolicy.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {hotelDetails.policies?.general && (
                  <Card>
                    <CardHeader>
                      <CardTitle>General Policies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {hotelDetails.policies.general.map((policy, index) => (
                          <div key={index}>
                            <h4 className="font-medium mb-1">{policy.title}</h4>
                            <p className="text-gray-600">{policy.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {hotel.guestRating.overall.toFixed(1)}
                  </div>
                  <div className="flex justify-center items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(hotel.guestRating.overall)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{hotel.guestRating.totalReviews} reviews</p>
                </div>

                {hotel.guestRating.cleanliness && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="space-y-2">
                      {hotel.guestRating.cleanliness && (
                        <div className="flex justify-between">
                          <span className="text-sm">Cleanliness</span>
                          <span className="text-sm font-medium">{hotel.guestRating.cleanliness.toFixed(1)}</span>
                        </div>
                      )}
                      {hotel.guestRating.comfort && (
                        <div className="flex justify-between">
                          <span className="text-sm">Comfort</span>
                          <span className="text-sm font-medium">{hotel.guestRating.comfort.toFixed(1)}</span>
                        </div>
                      )}
                      {hotel.guestRating.location && (
                        <div className="flex justify-between">
                          <span className="text-sm">Location</span>
                          <span className="text-sm font-medium">{hotel.guestRating.location.toFixed(1)}</span>
                        </div>
                      )}
                      {hotel.guestRating.service && (
                        <div className="flex justify-between">
                          <span className="text-sm">Service</span>
                          <span className="text-sm font-medium">{hotel.guestRating.service.toFixed(1)}</span>
                        </div>
                      )}
                      {hotel.guestRating.value && (
                        <div className="flex justify-between">
                          <span className="text-sm">Value for money</span>
                          <span className="text-sm font-medium">{hotel.guestRating.value.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Hotel type</span>
                  <span className="text-sm font-medium">{hotel.hotelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Star rating</span>
                  <div className="flex">
                    {[...Array(hotel.starRating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Room types</span>
                  <span className="text-sm font-medium">{hotel.offers.length}</span>
                </div>
                {hotelDetails.rooms && (
                  <div className="flex justify-between">
                    <span className="text-sm">Total rooms</span>
                    <span className="text-sm font-medium">{hotelDetails.rooms.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelDetailsPage