// LiteAPI Types for Hotel Booking Integration

export interface HotelSearchRequest {
  checkIn: string // ISO date string (YYYY-MM-DD)
  checkOut: string // ISO date string (YYYY-MM-DD)
  occupancy: Occupancy[]
  currency?: string // Default: USD
  cityId?: string
  hotelIds?: string[]
  guestNationality?: string // Default: US
}

export interface Occupancy {
  adults: number
  children: number[]
}

export interface HotelSearchResponse {
  searchId: string
  timestamp: string
  hotels: Hotel[]
  totalCount: number
  currency: string
  searchCriteria: SearchCriteria
}

export interface SearchCriteria {
  checkIn: string
  checkOut: string
  occupancy: Occupancy[]
  currency: string
  cityId?: string
}

export interface Hotel {
  id: string
  name: string
  description: string
  address: Address
  contact: Contact
  location: Location
  images: HotelImage[]
  amenities: Amenity[]
  starRating: number
  guestRating: GuestRating
  offers: RoomOffer[]
  cancellationPolicy: CancellationPolicy
  chain?: HotelChain
  hotelType: string
}

export interface Address {
  street: string
  city: string
  state?: string
  country: string
  postalCode?: string
}

export interface Contact {
  phone?: string
  email?: string
  website?: string
}

export interface Location {
  latitude: number
  longitude: number
  timezone?: string
}

export interface HotelImage {
  url: string
  caption?: string
  category: 'main' | 'room' | 'amenity' | 'exterior' | 'interior' | 'lobby' | 'restaurant' | 'pool'
  width?: number
  height?: number
}

export interface Amenity {
  id: string
  name: string
  category: AmenityCategory
  description?: string
  icon?: string
}

export type AmenityCategory =
  | 'wifi'
  | 'parking'
  | 'pool'
  | 'fitness'
  | 'spa'
  | 'restaurant'
  | 'bar'
  | 'business'
  | 'pets'
  | 'accessibility'
  | 'family'
  | 'entertainment'
  | 'transportation'

export interface GuestRating {
  overall: number
  cleanliness?: number
  comfort?: number
  location?: number
  service?: number
  value?: number
  totalReviews: number
}

export interface RoomOffer {
  offerId: string
  roomType: RoomType
  ratePlan: RatePlan
  pricing: RoomPricing
  availability: Availability
  policies: RoomPolicies
  amenities: Amenity[]
}

export interface RoomType {
  id: string
  name: string
  description: string
  maxOccupancy: number
  bedTypes: BedType[]
  roomSize?: number
  images: HotelImage[]
}

export interface BedType {
  type: 'single' | 'double' | 'queen' | 'king' | 'sofa'
  quantity: number
}

export interface RatePlan {
  id: string
  name: string
  description?: string
  mealPlan: MealPlan
  paymentType: 'pay_now' | 'pay_later'
  refundable: boolean
}

export type MealPlan = 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive'

export interface RoomPricing {
  basePrice: number
  totalPrice: number
  currency: string
  taxes: Tax[]
  fees: Fee[]
  priceBreakdown: PriceBreakdown[]
  discounts?: Discount[]
}

export interface Tax {
  name: string
  amount: number
  currency: string
  included: boolean
}

export interface Fee {
  name: string
  amount: number
  currency: string
  required: boolean
  description?: string
}

export interface PriceBreakdown {
  date: string
  basePrice: number
  currency: string
}

export interface Discount {
  type: 'early_bird' | 'last_minute' | 'extended_stay' | 'membership'
  amount: number
  percentage?: number
  description: string
}

export interface Availability {
  available: boolean
  roomsLeft?: number
  lastBooked?: string
}

export interface RoomPolicies {
  cancellation: CancellationPolicy
  checkIn: CheckInPolicy
  checkOut: CheckOutPolicy
  children?: ChildrenPolicy
  pets?: PetPolicy
}

export interface CancellationPolicy {
  type: 'free' | 'partial' | 'non_refundable'
  deadline?: string // ISO datetime
  penalty?: number
  description: string
}

export interface CheckInPolicy {
  from: string // Time format HH:MM
  to: string // Time format HH:MM
  instructions?: string
}

export interface CheckOutPolicy {
  before: string // Time format HH:MM
  instructions?: string
}

export interface ChildrenPolicy {
  freeAge?: number
  maxAge?: number
  description: string
}

export interface PetPolicy {
  allowed: boolean
  fee?: number
  restrictions?: string
}

export interface HotelChain {
  id: string
  name: string
  logo?: string
}

// Booking related types
export interface PrebookRequest {
  offerId: string
  guestInfo: GuestInfo
  paymentInfo?: PaymentInfo
  specialRequests?: string
}

export interface GuestInfo {
  adults: AdultGuest[]
  children?: ChildGuest[]
}

export interface AdultGuest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  nationality?: string
  passport?: PassportInfo
}

export interface ChildGuest {
  firstName: string
  lastName: string
  dateOfBirth: string
  age: number
}

export interface PassportInfo {
  number: string
  country: string
  expiryDate: string
}

export interface PaymentInfo {
  method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
  cardNumber?: string
  expiryMonth?: number
  expiryYear?: number
  cvv?: string
  cardholderName?: string
  billingAddress?: Address
}

export interface PrebookResponse {
  prebookId: string
  offerId: string
  hotel: Hotel
  roomOffer: RoomOffer
  guestInfo: GuestInfo
  totalPrice: number
  currency: string
  cancellationPolicy: CancellationPolicy
  expiresAt: string // ISO datetime
  paymentRequired: boolean
  confirmationRequired: boolean
}

export interface BookingRequest {
  prebookId: string
  paymentInfo: PaymentInfo
  confirmationDetails?: BookingConfirmationDetails
}

export interface BookingConfirmationDetails {
  emailConfirmation: boolean
  smsConfirmation?: boolean
  confirmationEmail?: string
  confirmationPhone?: string
}

export interface BookingResponse {
  bookingId: string
  confirmationNumber: string
  status: BookingStatus
  hotel: Hotel
  roomOffer: RoomOffer
  guestInfo: GuestInfo
  checkIn: string
  checkOut: string
  totalPrice: number
  currency: string
  paymentStatus: PaymentStatus
  cancellationPolicy: CancellationPolicy
  voucher?: BookingVoucher
  createdAt: string
  updatedAt: string
}

export type BookingStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'failed'

export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'partial_refund'

export interface BookingVoucher {
  url: string
  qrCode?: string
  instructions: string
}

// Hotel Details API Response
export interface HotelDetailsResponse {
  hotel: Hotel
  rooms: RoomType[]
  policies: HotelPolicies
  nearbyAttractions?: NearbyAttraction[]
}

export interface HotelPolicies {
  general: GeneralPolicy[]
  checkin: CheckInPolicy
  checkout: CheckOutPolicy
  cancellation: CancellationPolicy
  children?: ChildrenPolicy
  pets?: PetPolicy
  smoking?: SmokingPolicy
}

export interface GeneralPolicy {
  title: string
  description: string
  category: 'general' | 'payment' | 'deposit' | 'age' | 'group'
}

export interface SmokingPolicy {
  allowed: boolean
  areas?: string[]
  fee?: number
  description: string
}

export interface NearbyAttraction {
  id: string
  name: string
  type: 'restaurant' | 'attraction' | 'shopping' | 'transport' | 'hospital' | 'airport'
  distance: number // in meters
  walkingTime?: number // in minutes
  description?: string
  rating?: number
}

// Search filters and sorting
export interface SearchFilters {
  priceRange?: {
    min: number
    max: number
  }
  starRating?: number[]
  guestRating?: number
  amenities?: string[]
  mealPlan?: MealPlan[]
  paymentType?: ('pay_now' | 'pay_later')[]
  cancellationPolicy?: ('free' | 'partial' | 'non_refundable')[]
  hotelChains?: string[]
  distance?: number // from city center in km
}

export interface SearchSorting {
  field: 'price' | 'rating' | 'distance' | 'popularity' | 'stars'
  direction: 'asc' | 'desc'
}

// API Error types
export interface LiteAPIError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

// Utility types for frontend
export interface SearchState {
  filters: SearchFilters
  sorting: SearchSorting
  page: number
  pageSize: number
}

export interface HotelListItem {
  hotel: Hotel
  bestOffer: RoomOffer
  distance?: number
}

export interface SearchResultMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}