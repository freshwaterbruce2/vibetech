import type { TokenResult, VerifyBuyerResponseDetails } from '@square/web-payments-sdk-types'

// Payment method types
export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'gift_card'

// Payment status types
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'refunded'

// Payment intent for hotel bookings
export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: PaymentMethod
  authorization?: {
    id: string
    amount: number
    expiresAt: string
    canCapture: boolean
    canCancel: boolean
  }
  booking: {
    bookingId: string
    hotelId: string
    roomOfferId: string
    checkIn: string
    checkOut: string
    guests: {
      adults: number
      children: number
    }
  }
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: BillingAddress
  }
  createdAt: string
  updatedAt: string
}

// Billing address for payment verification
export interface BillingAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  postalCode: string
}

// Guest information from booking flow
export interface GuestInfo {
  adults: Array<{
    firstName: string
    lastName: string
    email?: string
    phone?: string
    dateOfBirth?: string
    nationality?: string
  }>
  children: Array<{
    firstName: string
    lastName: string
    dateOfBirth?: string
    nationality?: string
    age: number
  }>
  specialRequests?: string
}

// Payment request for creating new payment
export interface CreatePaymentRequest {
  amount: number
  currency: string
  sourceId: string // Token from Square Web SDK
  verificationToken?: string // For 3D Secure
  bookingDetails: {
    hotelId: string
    roomOfferId: string
    checkIn: string
    checkOut: string
    guests: GuestInfo
  }
  billingAddress?: BillingAddress
  delayCapture?: boolean // True for preauthorization
  delayDuration?: string // e.g., "PT168H" for 7 days
  note?: string
}

// Payment response from API
export interface PaymentResponse {
  success: boolean
  payment?: PaymentIntent
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Capture payment request
export interface CapturePaymentRequest {
  paymentId: string
  amount?: number // Partial capture if different from authorized amount
}

// Cancel/void payment request
export interface CancelPaymentRequest {
  paymentId: string
  reason?: string
}

// Refund payment request
export interface RefundPaymentRequest {
  paymentId: string
  amount: number
  reason?: string
}

// Square Web SDK configuration
export interface SquareConfig {
  applicationId: string
  locationId: string
  environment: 'sandbox' | 'production'
}

// Payment form data
export interface PaymentFormData {
  token: TokenResult
  verifiedBuyer?: VerifyBuyerResponseDetails
  billingAddress?: BillingAddress
  savePaymentMethod?: boolean
}

// Payment error types
export interface PaymentError {
  code: 'INVALID_CARD' | 'INSUFFICIENT_FUNDS' | 'EXPIRED_CARD' | 'NETWORK_ERROR' | 'AUTHENTICATION_REQUIRED' | 'UNKNOWN_ERROR'
  message: string
  field?: string
  suggestion?: string
}

// Webhook event for payment status updates
export interface PaymentWebhookEvent {
  type: 'payment.updated' | 'payment.failed' | 'payment.completed'
  data: {
    object: PaymentIntent
  }
  eventId: string
  timestamp: string
}

// Hotel booking specific payment data
export interface HotelPaymentData {
  baseAmount: number
  taxes: number
  fees: number
  securityDeposit?: number
  totalAmount: number
  breakdown: Array<{
    description: string
    amount: number
    type: 'room' | 'tax' | 'fee' | 'deposit'
  }>
  currency: string
  nights: number
}

// Payment analytics data
export interface PaymentAnalytics {
  conversionRate: number
  averageTransactionAmount: number
  failureRate: number
  topFailureReasons: Array<{
    reason: string
    count: number
  }>
  paymentMethodDistribution: Record<PaymentMethod, number>
}

// 3D Secure verification details
export interface VerificationDetails {
  amount: string
  billingContact: {
    familyName: string
    givenName: string
    email?: string
    country?: string
    region?: string
    city?: string
    addressLines?: string[]
    postalCode?: string
    phone?: string
  }
  currencyCode: string
  intent: 'CHARGE' | 'STORE'
}

export default PaymentIntent