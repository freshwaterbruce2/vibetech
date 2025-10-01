export interface Hotel {
  id: string
  name: string
  description: string
  address: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  images: string[]
  amenities: Amenity[]
  rating: number
  reviewCount: number
  priceRange: {
    min: number
    max: number
  }
  currency: string
  starRating: number
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    pets: boolean
    smoking: boolean
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  rooms: Room[]
  featured: boolean
  verified: boolean
  distance?: number // Distance from search location in miles/km
}

export interface Room {
  id: string
  type: string
  name: string
  description: string
  images: string[]
  maxOccupancy: number
  bedConfiguration: string
  size: number // in square feet/meters
  amenities: string[]
  pricePerNight: number
  available: boolean
  totalPrice?: number // Calculated for date range
  taxes?: number
  fees?: number
}

export interface Amenity {
  id: string
  name: string
  category: 'essential' | 'comfort' | 'entertainment' | 'business' | 'accessibility'
  icon: string
  description?: string
}

export interface SearchFilters {
  location: string
  checkIn: Date
  checkOut: Date
  guests: {
    adults: number
    children: number
    rooms: number
  }
  priceRange: {
    min: number
    max: number
  }
  starRating: number[]
  amenities: string[]
  propertyTypes: string[]
  sortBy: 'price' | 'rating' | 'distance' | 'popularity'
  sortOrder: 'asc' | 'desc'
}

export interface SearchResults {
  hotels: Hotel[]
  total: number
  page: number
  limit: number
  filters: SearchFilters
  searchId: string
}

export interface Booking {
  id: string
  userId: string
  hotelId: string
  roomId: string
  checkIn: Date
  checkOut: Date
  guests: {
    adults: number
    children: number
  }
  totalPrice: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  guestDetails: {
    firstName: string
    lastName: string
    email: string
    phone: string
    specialRequests?: string
  }
  confirmation: {
    confirmationNumber: string
    voucher?: string
  }
  cancellation?: {
    cancelledAt: Date
    reason: string
    refundAmount: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Review {
  id: string
  hotelId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  pros: string[]
  cons: string[]
  roomType: string
  travelType: 'business' | 'leisure' | 'family' | 'couple' | 'solo'
  stayDate: Date
  createdAt: Date
  helpful: number
  verified: boolean
  response?: {
    text: string
    respondedAt: Date
    respondedBy: string
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  preferences: {
    currency: string
    language: string
    newsletter: boolean
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  loyaltyProgram?: {
    level: 'bronze' | 'silver' | 'gold' | 'platinum'
    points: number
    benefits: string[]
  }
  paymentMethods: PaymentMethod[]
  addresses: Address[]
  createdAt: Date
  lastLogin: Date
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  billingAddress: Address
}

export interface Address {
  id: string
  label: string
  street: string
  city: string
  state: string
  country: string
  zipCode: string
  isDefault: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// LiteAPI specific types
export interface LiteApiHotel {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
  zipcode: string
  main_photo: string
  photos: string[]
  description: string
  amenities: string[]
  star_rating: number
}

export interface LiteApiRate {
  room_id: string
  room_name: string
  rate_id: string
  price: number
  currency: string
  cancellation_policy: string
  meal_plan: string
  bed_type: string
  max_occupancy: number
}