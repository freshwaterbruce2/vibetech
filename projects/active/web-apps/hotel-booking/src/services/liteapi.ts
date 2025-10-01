import { apiClient } from './api'
import { config } from '@/config/environment'
import type {
  HotelSearchRequest,
  HotelSearchResponse,
  Hotel,
  RoomOffer,
  PrebookRequest,
  PrebookResponse,
  BookingRequest,
  BookingResponse,
  HotelDetailsResponse
} from '@/types/liteapi'

// LiteAPI Service Class
class LiteAPIService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = config.services.liteApi.baseUrl
    this.apiKey = config.services.liteApi.apiKey
  }

  // Search for hotels with rates
  async searchHotels(searchParams: HotelSearchRequest): Promise<HotelSearchResponse> {
    try {
      const response = await apiClient.post<HotelSearchResponse>(
        '/hotels/rates',
        {
          checkin: searchParams.checkIn,
          checkout: searchParams.checkOut,
          occupancy: searchParams.occupancy,
          currency: searchParams.currency || 'USD',
          cityId: searchParams.cityId,
          hotelIds: searchParams.hotelIds,
          guestNationality: searchParams.guestNationality || 'US',
          timeout: 20000 // 20 second timeout for hotel search
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          }
        }
      )

      return {
        ...response.data,
        searchId: this.generateSearchId(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('LiteAPI hotel search error:', error)
      throw new Error('Failed to search hotels. Please try again.')
    }
  }

  // Get hotel details
  async getHotelDetails(hotelId: string): Promise<HotelDetailsResponse> {
    try {
      const response = await apiClient.get<HotelDetailsResponse>(
        `/hotels/${hotelId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('LiteAPI hotel details error:', error)
      throw new Error('Failed to fetch hotel details. Please try again.')
    }
  }

  // Prebook - Create checkout session
  async prebookRoom(prebookData: PrebookRequest): Promise<PrebookResponse> {
    try {
      const response = await apiClient.post<PrebookResponse>(
        '/rates/prebook',
        prebookData,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('LiteAPI prebook error:', error)
      throw new Error('Failed to create booking session. Please try again.')
    }
  }

  // Confirm booking
  async confirmBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await apiClient.post<BookingResponse>(
        '/rates/book',
        bookingData,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('LiteAPI booking confirmation error:', error)
      throw new Error('Failed to confirm booking. Please try again.')
    }
  }

  // Get user bookings
  async getUserBookings(userId: string): Promise<BookingResponse[]> {
    try {
      const response = await apiClient.get<{ bookings: BookingResponse[] }>(
        `/guests/${userId}/bookings`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          }
        }
      )

      return response.data.bookings || []
    } catch (error) {
      console.error('LiteAPI get bookings error:', error)
      throw new Error('Failed to fetch bookings. Please try again.')
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.put(
        `/bookings/${bookingId}`,
        { status: 'cancelled' },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          }
        }
      )

      return {
        success: true,
        message: 'Booking cancelled successfully'
      }
    } catch (error) {
      console.error('LiteAPI cancel booking error:', error)
      throw new Error('Failed to cancel booking. Please try again.')
    }
  }

  // Search cities for autocomplete
  async searchCities(query: string): Promise<Array<{ id: string; name: string; country: string }>> {
    try {
      const response = await apiClient.get<{ cities: Array<{ id: string; name: string; country: string }> }>(
        `/cities/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          }
        }
      )

      return response.data.cities || []
    } catch (error) {
      console.error('LiteAPI city search error:', error)
      return []
    }
  }

  // Get popular destinations
  async getPopularDestinations(): Promise<Array<{ id: string; name: string; country: string; imageUrl: string }>> {
    try {
      const response = await apiClient.get<{ destinations: Array<{ id: string; name: string; country: string; imageUrl: string }> }>(
        '/destinations/popular',
        {
          headers: {
            'X-API-Key': this.apiKey,
          }
        }
      )

      return response.data.destinations || []
    } catch (error) {
      console.error('LiteAPI popular destinations error:', error)
      // Return fallback popular destinations
      return this.getFallbackDestinations()
    }
  }

  // Helper methods
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  private getFallbackDestinations() {
    return [
      { id: 'NYC', name: 'New York', country: 'United States', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400' },
      { id: 'PAR', name: 'Paris', country: 'France', imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?q=80&w=400' },
      { id: 'LON', name: 'London', country: 'United Kingdom', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400' },
      { id: 'TOK', name: 'Tokyo', country: 'Japan', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400' },
      { id: 'DUB', name: 'Dubai', country: 'UAE', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=400' },
      { id: 'BAR', name: 'Barcelona', country: 'Spain', imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=400' }
    ]
  }

  // Format currency
  formatPrice(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Calculate nights between dates
  calculateNights(checkIn: Date, checkOut: Date): number {
    const diffTime = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// Export singleton instance
export const liteAPIService = new LiteAPIService()
export default liteAPIService