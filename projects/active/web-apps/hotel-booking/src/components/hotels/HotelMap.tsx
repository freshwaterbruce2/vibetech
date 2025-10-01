import React, { useState } from 'react'
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { config } from '@/config/environment'
import type { Hotel, NearbyAttraction } from '@/types/liteapi'
import 'mapbox-gl/dist/mapbox-gl.css'

interface HotelMapProps {
  hotel: Hotel
  nearbyAttractions?: NearbyAttraction[]
  className?: string
}

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
}

const HotelMap: React.FC<HotelMapProps> = ({
  hotel,
  nearbyAttractions = [],
  className
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: hotel.location.longitude,
    latitude: hotel.location.latitude,
    zoom: 15
  })

  // Handle cases where no mapbox token is available
  if (!config.services.mapbox.accessToken) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
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
                {hotel.address.street}, {hotel.address.city}
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              const query = encodeURIComponent(`${hotel.name} ${hotel.address.street} ${hotel.address.city}`)
              window.open(`https://www.google.com/maps/search/${query}`, '_blank')
            }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Google Maps
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getAttractionIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍽️'
      case 'attraction': return '🎭'
      case 'shopping': return '🛍️'
      case 'transport': return '🚇'
      case 'hospital': return '🏥'
      case 'airport': return '✈️'
      default: return '📍'
    }
  }

  const getAttractionColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-orange-500'
      case 'attraction': return 'bg-purple-500'
      case 'shopping': return 'bg-pink-500'
      case 'transport': return 'bg-blue-500'
      case 'hospital': return 'bg-red-500'
      case 'airport': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location & Nearby
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const query = encodeURIComponent(`${hotel.name} ${hotel.address.street} ${hotel.address.city}`)
              window.open(`https://www.google.com/maps/search/${query}`, '_blank')
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Google Maps
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 relative">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapboxAccessToken={config.services.mapbox.accessToken}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            attributionControl={false}
          >
            {/* Map Controls */}
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl position="bottom-left" />

            {/* Hotel Marker */}
            <Marker
              longitude={hotel.location.longitude}
              latitude={hotel.location.latitude}
            >
              <div className="cursor-pointer">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600" />
                </div>
              </div>
            </Marker>

            {/* Nearby Attractions */}
            {nearbyAttractions.map((attraction) => {
              // Calculate approximate coordinates (this would normally come from the API)
              const offsetLat = (Math.random() - 0.5) * 0.01
              const offsetLng = (Math.random() - 0.5) * 0.01

              return (
                <Marker
                  key={attraction.id}
                  longitude={hotel.location.longitude + offsetLng}
                  latitude={hotel.location.latitude + offsetLat}
                >
                  <div className="cursor-pointer group">
                    <div className={`flex items-center justify-center w-8 h-8 ${getAttractionColor(attraction.type)} text-white rounded-full shadow-lg text-xs font-bold`}>
                      {getAttractionIcon(attraction.type)}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {attraction.name}
                        <br />
                        {(attraction.distance / 1000).toFixed(1)} km away
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
                    </div>
                  </div>
                </Marker>
              )
            })}
          </Map>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs max-w-48">
            <div className="font-medium mb-2">Map Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <MapPin className="w-2 h-2" />
                </div>
                <span>{hotel.name}</span>
              </div>
              {nearbyAttractions.length > 0 && (
                <>
                  <div className="border-t pt-1 mt-1">
                    <div className="text-xs font-medium text-gray-600 mb-1">Nearby Places</div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-1">
                        <span>🍽️</span><span className="text-xs">Food</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🎭</span><span className="text-xs">Sights</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🛍️</span><span className="text-xs">Shop</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🚇</span><span className="text-xs">Transit</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hotel Info Overlay */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-64">
            <div className="font-medium text-sm mb-1">{hotel.name}</div>
            <div className="text-xs text-gray-600 mb-2">
              {hotel.address.street}
              <br />
              {hotel.address.city}, {hotel.address.country}
            </div>
            {hotel.contact.phone && (
              <div className="text-xs text-gray-600">
                📞 {hotel.contact.phone}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default HotelMap