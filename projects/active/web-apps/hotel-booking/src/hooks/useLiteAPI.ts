import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { liteAPIService } from '@/services/liteapi'
import type {
  HotelSearchRequest,
  HotelSearchResponse,
  HotelDetailsResponse,
  PrebookRequest,
  PrebookResponse,
  BookingRequest,
  BookingResponse,
  SearchFilters,
  SearchSorting,
  HotelListItem
} from '@/types/liteapi'

// Query Keys
export const liteAPIKeys = {
  all: ['liteapi'] as const,
  searches: () => [...liteAPIKeys.all, 'searches'] as const,
  search: (params: HotelSearchRequest) => [...liteAPIKeys.searches(), params] as const,
  hotels: () => [...liteAPIKeys.all, 'hotels'] as const,
  hotel: (id: string) => [...liteAPIKeys.hotels(), id] as const,
  bookings: () => [...liteAPIKeys.all, 'bookings'] as const,
  userBookings: (userId: string) => [...liteAPIKeys.bookings(), 'user', userId] as const,
  cities: () => [...liteAPIKeys.all, 'cities'] as const,
  citySearch: (query: string) => [...liteAPIKeys.cities(), 'search', query] as const,
  destinations: () => [...liteAPIKeys.all, 'destinations'] as const,
}

// Hotel Search Hook
export function useHotelSearch(searchParams: HotelSearchRequest, enabled = true) {
  return useQuery({
    queryKey: liteAPIKeys.search(searchParams),
    queryFn: () => liteAPIService.searchHotels(searchParams),
    enabled: enabled && !!searchParams.checkIn && !!searchParams.checkOut,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Hotel Details Hook
export function useHotelDetails(hotelId: string, enabled = true) {
  return useQuery({
    queryKey: liteAPIKeys.hotel(hotelId),
    queryFn: () => liteAPIService.getHotelDetails(hotelId),
    enabled: enabled && !!hotelId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}

// City Search Hook for Autocomplete
export function useCitySearch(query: string, enabled = true) {
  return useQuery({
    queryKey: liteAPIKeys.citySearch(query),
    queryFn: () => liteAPIService.searchCities(query),
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  })
}

// Popular Destinations Hook
export function usePopularDestinations() {
  return useQuery({
    queryKey: liteAPIKeys.destinations(),
    queryFn: () => liteAPIService.getPopularDestinations(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  })
}

// User Bookings Hook
export function useUserBookings(userId: string, enabled = true) {
  return useQuery({
    queryKey: liteAPIKeys.userBookings(userId),
    queryFn: () => liteAPIService.getUserBookings(userId),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

// Prebook Mutation
export function usePrebookRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (prebookData: PrebookRequest) =>
      liteAPIService.prebookRoom(prebookData),
    onSuccess: () => {
      // Invalidate searches to refresh availability
      queryClient.invalidateQueries({ queryKey: liteAPIKeys.searches() })
    },
    onError: (error) => {
      console.error('Prebook failed:', error)
    }
  })
}

// Booking Confirmation Mutation
export function useConfirmBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingData: BookingRequest) =>
      liteAPIService.confirmBooking(bookingData),
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch user bookings
      queryClient.invalidateQueries({ queryKey: liteAPIKeys.bookings() })

      // Invalidate searches to refresh availability
      queryClient.invalidateQueries({ queryKey: liteAPIKeys.searches() })
    },
    onError: (error) => {
      console.error('Booking confirmation failed:', error)
    }
  })
}

// Cancel Booking Mutation
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: string) =>
      liteAPIService.cancelBooking(bookingId),
    onSuccess: () => {
      // Invalidate bookings to refresh the list
      queryClient.invalidateQueries({ queryKey: liteAPIKeys.bookings() })

      // Invalidate searches to refresh availability
      queryClient.invalidateQueries({ queryKey: liteAPIKeys.searches() })
    },
    onError: (error) => {
      console.error('Booking cancellation failed:', error)
    }
  })
}

// Custom hook for filtered and sorted hotel results
export function useFilteredHotels(
  searchResults: HotelSearchResponse | undefined,
  filters: SearchFilters,
  sorting: SearchSorting
) {
  return React.useMemo(() => {
    if (!searchResults?.hotels) return []

    let filteredHotels = searchResults.hotels.map(hotel => ({
      hotel,
      bestOffer: hotel.offers[0], // Assuming first offer is the best/cheapest
      distance: 0 // Calculate from user location or city center
    }))

    // Apply filters
    if (filters.priceRange) {
      filteredHotels = filteredHotels.filter(item => {
        const price = item.bestOffer.pricing.totalPrice
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max
      })
    }

    if (filters.starRating?.length) {
      filteredHotels = filteredHotels.filter(item =>
        filters.starRating!.includes(item.hotel.starRating)
      )
    }

    if (filters.guestRating) {
      filteredHotels = filteredHotels.filter(item =>
        item.hotel.guestRating.overall >= filters.guestRating!
      )
    }

    if (filters.amenities?.length) {
      filteredHotels = filteredHotels.filter(item =>
        filters.amenities!.some(amenityId =>
          item.hotel.amenities.some(amenity => amenity.id === amenityId)
        )
      )
    }

    if (filters.mealPlan?.length) {
      filteredHotels = filteredHotels.filter(item =>
        filters.mealPlan!.includes(item.bestOffer.ratePlan.mealPlan)
      )
    }

    if (filters.paymentType?.length) {
      filteredHotels = filteredHotels.filter(item =>
        filters.paymentType!.includes(item.bestOffer.ratePlan.paymentType)
      )
    }

    if (filters.cancellationPolicy?.length) {
      filteredHotels = filteredHotels.filter(item =>
        filters.cancellationPolicy!.includes(item.bestOffer.policies.cancellation.type)
      )
    }

    // Apply sorting
    filteredHotels.sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sorting.field) {
        case 'price':
          aValue = a.bestOffer.pricing.totalPrice
          bValue = b.bestOffer.pricing.totalPrice
          break
        case 'rating':
          aValue = a.hotel.guestRating.overall
          bValue = b.hotel.guestRating.overall
          break
        case 'stars':
          aValue = a.hotel.starRating
          bValue = b.hotel.starRating
          break
        case 'distance':
          aValue = a.distance || 0
          bValue = b.distance || 0
          break
        case 'popularity':
          aValue = a.hotel.guestRating.totalReviews
          bValue = b.hotel.guestRating.totalReviews
          break
        default:
          return 0
      }

      if (sorting.direction === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    return filteredHotels
  }, [searchResults, filters, sorting])
}

// Helper hook for search analytics
export function useSearchAnalytics() {
  const queryClient = useQueryClient()

  const trackSearchEvent = React.useCallback((searchParams: HotelSearchRequest, resultCount: number) => {
    // Track search analytics
    console.log('Search event:', {
      destination: searchParams.cityId,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.occupancy.reduce((total, occ) => total + occ.adults + occ.children.length, 0),
      resultCount,
      timestamp: new Date().toISOString()
    })
  }, [])

  const trackFilterEvent = React.useCallback((filters: SearchFilters) => {
    // Track filter usage
    console.log('Filter event:', {
      filters,
      timestamp: new Date().toISOString()
    })
  }, [])

  const trackBookingEvent = React.useCallback((hotelId: string, offerId: string, totalPrice: number) => {
    // Track booking events
    console.log('Booking event:', {
      hotelId,
      offerId,
      totalPrice,
      timestamp: new Date().toISOString()
    })
  }, [])

  return {
    trackSearchEvent,
    trackFilterEvent,
    trackBookingEvent
  }
}

export default {
  useHotelSearch,
  useHotelDetails,
  useCitySearch,
  usePopularDestinations,
  useUserBookings,
  usePrebookRoom,
  useConfirmBooking,
  useCancelBooking,
  useFilteredHotels,
  useSearchAnalytics
}