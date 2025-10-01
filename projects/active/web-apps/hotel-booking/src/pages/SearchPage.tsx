import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Filter, SortAsc, Grid3X3, List, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SearchForm from '@/components/search/SearchForm'
import HotelCard from '@/components/hotels/HotelCard'
import SearchFilters from '@/components/search/SearchFilters'
import SearchSorting from '@/components/search/SearchSorting'
import SearchMap from '@/components/search/SearchMap'
import { useHotelSearch, useFilteredHotels, useSearchAnalytics } from '@/hooks/useLiteAPI'
import { useBooking } from '@/contexts/BookingContext'
import type { HotelSearchRequest, SearchFilters as ISearchFilters, SearchSorting as ISearchSorting } from '@/types/liteapi'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { searchFilters } = useBooking()
  const { trackSearchEvent, trackFilterEvent } = useSearchAnalytics()

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Search and filter state
  const [filters, setFilters] = useState<ISearchFilters>({})
  const [sorting, setSorting] = useState<ISearchSorting>({
    field: 'popularity',
    direction: 'desc'
  })

  // Build search request from URL params or context
  const searchRequest: HotelSearchRequest = React.useMemo(() => {
    const location = searchParams.get('location') || searchFilters.location
    const checkIn = searchParams.get('checkIn') || searchFilters.checkIn.toISOString().split('T')[0]
    const checkOut = searchParams.get('checkOut') || searchFilters.checkOut.toISOString().split('T')[0]
    const adults = parseInt(searchParams.get('adults') || searchFilters.guests.adults.toString())
    const children = parseInt(searchParams.get('children') || searchFilters.guests.children.toString())
    const rooms = parseInt(searchParams.get('rooms') || searchFilters.guests.rooms.toString())

    return {
      checkIn,
      checkOut,
      occupancy: [{
        adults,
        children: Array(children).fill(0).map((_, i) => i + 5) // Assuming ages 5-12 for children
      }],
      currency: 'USD',
      cityId: location, // In real app, convert location string to city ID
      guestNationality: 'US'
    }
  }, [searchParams, searchFilters])

  // Hotel search query
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    refetch
  } = useHotelSearch(searchRequest, !!searchRequest.checkIn && !!searchRequest.checkOut)

  // Filtered and sorted results
  const filteredHotels = useFilteredHotels(searchResults, filters, sorting)

  // Track search events
  useEffect(() => {
    if (searchResults) {
      trackSearchEvent(searchRequest, searchResults.hotels.length)
    }
  }, [searchResults, searchRequest, trackSearchEvent])

  // Track filter events
  useEffect(() => {
    trackFilterEvent(filters)
  }, [filters, trackFilterEvent])

  const handleFilterChange = (newFilters: ISearchFilters) => {
    setFilters(newFilters)
  }

  const handleSortingChange = (newSorting: ISearchSorting) => {
    setSorting(newSorting)
  }

  const handleRetry = () => {
    refetch()
  }

  const totalResults = filteredHotels.length
  const hasResults = totalResults > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Form Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <SearchForm />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search Summary & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {searchRequest.cityId ? `Hotels in ${searchRequest.cityId}` : 'Search Results'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>
                {searchRequest.checkIn} - {searchRequest.checkOut}
              </span>
              <span>•</span>
              <span>
                {searchRequest.occupancy[0].adults} adult{searchRequest.occupancy[0].adults !== 1 ? 's' : ''}
                {searchRequest.occupancy[0].children.length > 0 && (
                  <>, {searchRequest.occupancy[0].children.length} child{searchRequest.occupancy[0].children.length !== 1 ? 'ren' : ''}</>
                )}
              </span>
              {totalResults > 0 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-blue-600">
                    {totalResults} hotel{totalResults !== 1 ? 's' : ''} found
                  </span>
                </>
              )}
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={isFiltersOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <SearchSorting
              sorting={sorting}
              onSortingChange={handleSortingChange}
            />

            <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="rounded-none border-0"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-32">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFilterChange}
                searchResults={searchResults}
              />
            </div>
          </div>

          {/* Mobile Filters Overlay */}
          <AnimatePresence>
            {isFiltersOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
                onClick={() => setIsFiltersOpen(false)}
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Filters</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFiltersOpen(false)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <SearchFilters
                      filters={filters}
                      onFiltersChange={handleFilterChange}
                      searchResults={searchResults}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Searching hotels...</p>
                </div>
                {/* Loading Skeletons */}
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="w-48 h-32 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-2/3" />
                          <div className="flex justify-between items-center mt-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="text-center py-12">
                <Alert className="max-w-md mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error instanceof Error ? error.message : 'Failed to search hotels. Please try again.'}
                  </AlertDescription>
                </Alert>
                <Button onClick={handleRetry} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !isError && !hasResults && searchResults && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hotels found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search criteria to find more options.
                </p>
                <Button variant="outline" onClick={() => setFilters({})}>
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Results */}
            {!isLoading && !isError && hasResults && (
              <div className="space-y-4">
                {viewMode === 'map' ? (
                  <SearchMap hotels={filteredHotels} />
                ) : (
                  <AnimatePresence>
                    {filteredHotels.map((hotelItem, index) => (
                      <motion.div
                        key={hotelItem.hotel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <HotelCard
                          hotel={hotelItem.hotel}
                          offer={hotelItem.bestOffer}
                          viewMode={viewMode}
                          searchRequest={searchRequest}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* Pagination */}
                {filteredHotels.length > 20 && (
                  <div className="flex justify-center pt-8">
                    <Button variant="outline">
                      Load More Hotels
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage