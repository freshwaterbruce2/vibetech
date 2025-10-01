import React, { createContext, useContext, useReducer } from 'react'
import { SearchFilters, Hotel, Room, Booking } from '@/types/hotel'

interface BookingState {
  searchFilters: SearchFilters
  selectedHotel: Hotel | null
  selectedRoom: Room | null
  bookingDetails: Partial<Booking> | null
  searchResults: Hotel[]
  isLoading: boolean
  error: string | null
  currentStep: 'search' | 'hotel' | 'room' | 'booking' | 'payment' | 'confirmation'
}

type BookingAction =
  | { type: 'SET_SEARCH_FILTERS'; payload: SearchFilters }
  | { type: 'SET_SEARCH_RESULTS'; payload: Hotel[] }
  | { type: 'SELECT_HOTEL'; payload: Hotel }
  | { type: 'SELECT_ROOM'; payload: Room }
  | { type: 'SET_BOOKING_DETAILS'; payload: Partial<Booking> }
  | { type: 'SET_CURRENT_STEP'; payload: BookingState['currentStep'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_BOOKING' }
  | { type: 'UPDATE_GUESTS'; payload: { adults: number; children: number; rooms: number } }

interface BookingContextType extends BookingState {
  updateSearchFilters: (filters: Partial<SearchFilters>) => void
  setSearchResults: (results: Hotel[]) => void
  selectHotel: (hotel: Hotel) => void
  selectRoom: (room: Room) => void
  updateBookingDetails: (details: Partial<Booking>) => void
  setCurrentStep: (step: BookingState['currentStep']) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearBooking: () => void
  updateGuests: (guests: { adults: number; children: number; rooms: number }) => void
  calculateNights: () => number
  calculateTotalPrice: () => number
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

const defaultSearchFilters: SearchFilters = {
  location: '',
  checkIn: new Date(),
  checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  guests: {
    adults: 2,
    children: 0,
    rooms: 1
  },
  priceRange: {
    min: 0,
    max: 1000
  },
  starRating: [],
  amenities: [],
  propertyTypes: [],
  sortBy: 'price',
  sortOrder: 'asc'
}

const initialState: BookingState = {
  searchFilters: defaultSearchFilters,
  selectedHotel: null,
  selectedRoom: null,
  bookingDetails: null,
  searchResults: [],
  isLoading: false,
  error: null,
  currentStep: 'search'
}

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_SEARCH_FILTERS':
      return {
        ...state,
        searchFilters: action.payload
      }
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null
      }
    case 'SELECT_HOTEL':
      return {
        ...state,
        selectedHotel: action.payload,
        selectedRoom: null,
        currentStep: 'hotel'
      }
    case 'SELECT_ROOM':
      return {
        ...state,
        selectedRoom: action.payload,
        currentStep: 'booking'
      }
    case 'SET_BOOKING_DETAILS':
      return {
        ...state,
        bookingDetails: {
          ...state.bookingDetails,
          ...action.payload
        }
      }
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    case 'CLEAR_BOOKING':
      return {
        ...initialState,
        searchFilters: state.searchFilters // Keep search filters
      }
    case 'UPDATE_GUESTS':
      return {
        ...state,
        searchFilters: {
          ...state.searchFilters,
          guests: action.payload
        }
      }
    default:
      return state
  }
}

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState)

  const updateSearchFilters = (filters: Partial<SearchFilters>) => {
    dispatch({
      type: 'SET_SEARCH_FILTERS',
      payload: { ...state.searchFilters, ...filters }
    })
  }

  const setSearchResults = (results: Hotel[]) => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results })
  }

  const selectHotel = (hotel: Hotel) => {
    dispatch({ type: 'SELECT_HOTEL', payload: hotel })
  }

  const selectRoom = (room: Room) => {
    dispatch({ type: 'SELECT_ROOM', payload: room })
  }

  const updateBookingDetails = (details: Partial<Booking>) => {
    dispatch({ type: 'SET_BOOKING_DETAILS', payload: details })
  }

  const setCurrentStep = (step: BookingState['currentStep']) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const clearBooking = () => {
    dispatch({ type: 'CLEAR_BOOKING' })
  }

  const updateGuests = (guests: { adults: number; children: number; rooms: number }) => {
    dispatch({ type: 'UPDATE_GUESTS', payload: guests })
  }

  const calculateNights = (): number => {
    const { checkIn, checkOut } = state.searchFilters
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateTotalPrice = (): number => {
    if (!state.selectedRoom) return 0

    const nights = calculateNights()
    const basePrice = state.selectedRoom.pricePerNight * nights
    const taxes = basePrice * 0.1 // 10% tax
    const fees = 25 // Flat booking fee

    return basePrice + taxes + fees
  }

  const value: BookingContextType = {
    ...state,
    updateSearchFilters,
    setSearchResults,
    selectHotel,
    selectRoom,
    updateBookingDetails,
    setCurrentStep,
    setLoading,
    setError,
    clearBooking,
    updateGuests,
    calculateNights,
    calculateTotalPrice
  }

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}

export default BookingContext