import React, { useState, useCallback, useRef } from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import { MapPin, Star, DollarSign, Phone, Globe, Navigation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { config } from '@/config/environment'
import type { HotelListItem } from '@/types/liteapi'
import 'mapbox-gl/dist/mapbox-gl.css'

interface SearchMapProps {
  hotels: HotelListItem[]
  selectedHotel?: string
  onHotelSelect?: (hotelId: string) => void
  className?: string
}

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
}

const SearchMap: React.FC<SearchMapProps> = ({
  hotels,
  selectedHotel,
  onHotelSelect,
  className
}) => {
  // Default center (can be overridden by hotel locations)
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -74.006, // NYC default
    latitude: 40.7128,
    zoom: 12
  })

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const mapRef = useRef(null)

  // Calculate map center based on hotel locations
  React.useEffect(() => {
    if (hotels.length > 0) {
      // Use the first hotel's location as the center, or calculate centroid
      const hotel = hotels[0]
      if (hotel.hotel.location) {
        setViewState({
          longitude: hotel.hotel.location.longitude,
          latitude: hotel.hotel.location.latitude,
          zoom: hotels.length === 1 ? 15 : 12
        })
      }
    }
  }, [hotels])

  const onMarkerClick = useCallback((hotelId: string) => {
    setSelectedMarker(hotelId)
    onHotelSelect?.(hotelId)
  }, [onHotelSelect])

  const onMapClick = useCallback(() => {
    setSelectedMarker(null)
  }, [])

  // Fit map to show all hotels
  const fitToHotels = useCallback(() => {
    if (!mapRef.current || hotels.length === 0) return

    const bounds = hotels.reduce((bounds, hotel) => {
      const { longitude, latitude } = hotel.hotel.location
      return bounds.extend([longitude, latitude])
    }, new mapboxgl.LngLatBounds())

    mapRef.current.fitBounds(bounds, { padding: 40 })
  }, [hotels])

  // Handle cases where no mapbox token is available
  if (!config.services.mapbox.accessToken) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Map View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Navigation className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Map Unavailable</h3>
              <p className="text-gray-600 mb-4">
                Map service is not configured. Please contact support.
              </p>
              <p className="text-sm text-gray-500">
                {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} in this area
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedHotelData = selectedMarker
    ? hotels.find(hotel => hotel.hotel.id === selectedMarker)
    : null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Hotel Locations
          </div>
          {hotels.length > 1 && (
            <Button variant="outline" size="sm" onClick={fitToHotels}>
              View All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 relative">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={onMapClick}
            mapboxAccessToken={config.services.mapbox.accessToken}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            attributionControl={false}
          >
            {/* Map Controls */}
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl position="bottom-left" />

            {/* Hotel Markers */}
            {hotels.map((hotelItem) => {
              const { hotel } = hotelItem
              const isSelected = selectedHotel === hotel.id || selectedMarker === hotel.id

              return (
                <Marker
                  key={hotel.id}
                  longitude={hotel.location.longitude}
                  latitude={hotel.location.latitude}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    onMarkerClick(hotel.id)
                  }}
                >
                  <div
                    className={`cursor-pointer transition-transform hover:scale-110 ${
                      isSelected ? 'scale-125' : ''
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-lg ${
                        isSelected
                          ? 'bg-blue-600 border-2 border-white'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      ${Math.round(hotelItem.bestOffer.pricing.basePrice)}
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                      <div
                        className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                          isSelected ? 'border-t-blue-600' : 'border-t-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </Marker>
              )
            })}

            {/* Hotel Popup */}
            {selectedHotelData && (
              <Popup
                longitude={selectedHotelData.hotel.location.longitude}
                latitude={selectedHotelData.hotel.location.latitude}
                onClose={() => setSelectedMarker(null)}
                closeButton={true}
                closeOnClick={false}
                maxWidth="320px"
                offset={[0, -15]}
              >
                <div className="p-4 max-w-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight pr-2">
                      {selectedHotelData.hotel.name}
                    </h3>
                    <div className="flex items-center">
                      {[...Array(selectedHotelData.hotel.starRating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">
                    {selectedHotelData.hotel.address.street}, {selectedHotelData.hotel.address.city}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">
                        {selectedHotelData.hotel.guestRating.overall.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({selectedHotelData.hotel.guestRating.totalReviews} reviews)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {selectedHotelData.bestOffer.ratePlan.mealPlan.replace('_', ' ')}
                    </Badge>
                    <Badge variant={selectedHotelData.bestOffer.ratePlan.refundable ? "default" : "secondary"} className="text-xs">
                      {selectedHotelData.bestOffer.ratePlan.refundable ? 'Refundable' : 'Non-refundable'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        ${selectedHotelData.bestOffer.pricing.totalPrice}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.open(`/hotel/${selectedHotelData.hotel.id}`, '_blank')}
                    >
                      View Details
                    </Button>
                  </div>

                  {selectedHotelData.hotel.contact.website && (
                    <div className="mt-2 pt-2 border-t">
                      <a
                        href={selectedHotelData.hotel.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        Hotel Website
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </Map>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
            <div className="font-medium mb-2">Map Legend</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">$</div>
              <span>Hotel with price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">$</div>
              <span>Selected hotel</span>
            </div>
          </div>

          {/* Hotel Count */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium">
            {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SearchMap