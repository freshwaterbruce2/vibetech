import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Search, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useBooking } from '@/contexts/BookingContext'
import { formatDate } from '@/lib/utils'

const SearchForm = () => {
  const navigate = useNavigate()
  const { searchFilters, updateSearchFilters } = useBooking()
  const [isGuestsOpen, setIsGuestsOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)

  const [localFilters, setLocalFilters] = useState({
    location: searchFilters.location,
    checkIn: searchFilters.checkIn,
    checkOut: searchFilters.checkOut,
    adults: searchFilters.guests.adults,
    children: searchFilters.guests.children,
    rooms: searchFilters.guests.rooms,
  })

  const handleLocationChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, location: value }))
  }

  const handleDateChange = (type: 'checkIn' | 'checkOut', date: Date) => {
    setLocalFilters(prev => ({ ...prev, [type]: date }))
  }

  const handleGuestChange = (type: 'adults' | 'children' | 'rooms', action: 'increment' | 'decrement') => {
    setLocalFilters(prev => {
      const current = prev[type]
      let newValue = current

      if (action === 'increment') {
        if (type === 'adults' && current < 10) newValue = current + 1
        else if (type === 'children' && current < 8) newValue = current + 1
        else if (type === 'rooms' && current < 5) newValue = current + 1
      } else {
        if (type === 'adults' && current > 1) newValue = current - 1
        else if (type === 'children' && current > 0) newValue = current - 1
        else if (type === 'rooms' && current > 1) newValue = current - 1
      }

      return { ...prev, [type]: newValue }
    })
  }

  const handleSearch = () => {
    // Update global search filters
    updateSearchFilters({
      location: localFilters.location,
      checkIn: localFilters.checkIn,
      checkOut: localFilters.checkOut,
      guests: {
        adults: localFilters.adults,
        children: localFilters.children,
        rooms: localFilters.rooms,
      }
    })

    // Navigate to search results
    const searchParams = new URLSearchParams({
      location: localFilters.location,
      checkIn: localFilters.checkIn.toISOString(),
      checkOut: localFilters.checkOut.toISOString(),
      adults: localFilters.adults.toString(),
      children: localFilters.children.toString(),
      rooms: localFilters.rooms.toString(),
    })

    navigate(`/search?${searchParams.toString()}`)
  }

  const popularDestinations = [
    'New York, USA',
    'Paris, France',
    'Tokyo, Japan',
    'London, UK',
    'Dubai, UAE',
    'Barcelona, Spain',
  ]

  const totalGuests = localFilters.adults + localFilters.children
  const nightsCount = Math.ceil(
    (localFilters.checkOut.getTime() - localFilters.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
        <CardContent className="p-6">
          {/* Main Search Form */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Location Input */}
            <div className="lg:col-span-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Where are you going?"
                  value={localFilters.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="pl-10 h-14 text-base border-gray-200 focus:border-vibe-blue-500"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="lg:col-span-2">
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start text-left font-normal border-gray-200 hover:border-vibe-blue-500"
                  >
                    <Calendar className="mr-3 h-5 w-5 text-gray-400" />
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span>{formatDate(localFilters.checkIn, 'MMM dd')}</span>
                        <span className="text-gray-400">—</span>
                        <span>{formatDate(localFilters.checkOut, 'MMM dd')}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {nightsCount} night{nightsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Check-in
                        </label>
                        <input
                          type="date"
                          value={localFilters.checkIn.toISOString().split('T')[0]}
                          onChange={(e) => handleDateChange('checkIn', new Date(e.target.value))}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibe-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Check-out
                        </label>
                        <input
                          type="date"
                          value={localFilters.checkOut.toISOString().split('T')[0]}
                          onChange={(e) => handleDateChange('checkOut', new Date(e.target.value))}
                          min={localFilters.checkIn.toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibe-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div className="lg:col-span-1">
              <Popover open={isGuestsOpen} onOpenChange={setIsGuestsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start text-left font-normal border-gray-200 hover:border-vibe-blue-500"
                  >
                    <Users className="mr-3 h-5 w-5 text-gray-400" />
                    <div className="flex flex-col">
                      <span>
                        {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-500">
                        {localFilters.rooms} room{localFilters.rooms !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4 p-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Adults</div>
                        <div className="text-sm text-gray-500">Ages 13 or above</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange('adults', 'decrement')}
                          disabled={localFilters.adults <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{localFilters.adults}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange('adults', 'increment')}
                          disabled={localFilters.adults >= 10}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Children</div>
                        <div className="text-sm text-gray-500">Ages 0-12</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange('children', 'decrement')}
                          disabled={localFilters.children <= 0}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{localFilters.children}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange('children', 'increment')}
                          disabled={localFilters.children >= 8}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Rooms */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Rooms</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange('rooms', 'decrement')}
                          disabled={localFilters.rooms <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{localFilters.rooms}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange('rooms', 'increment')}
                          disabled={localFilters.rooms >= 5}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <Button
              onClick={handleSearch}
              className="w-full lg:w-auto px-8 h-12 bg-gradient-to-r from-vibe-blue-600 to-vibe-purple-600 hover:from-vibe-blue-700 hover:to-vibe-purple-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={!localFilters.location.trim()}
            >
              <Search className="mr-2 h-5 w-5" />
              Search Hotels
            </Button>

            {/* Popular Destinations */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 hidden lg:block">Popular:</span>
              {popularDestinations.slice(0, 3).map((destination) => (
                <Badge
                  key={destination}
                  variant="outline"
                  className="cursor-pointer hover:bg-vibe-blue-50 hover:border-vibe-blue-300 transition-colors"
                  onClick={() => handleLocationChange(destination)}
                >
                  {destination}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SearchForm