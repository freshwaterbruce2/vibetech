import axios from 'axios'
import { config } from '@/config/environment'
import type {
  CreatePaymentRequest,
  PaymentResponse,
  CapturePaymentRequest,
  CancelPaymentRequest,
  RefundPaymentRequest,
  PaymentIntent,
  HotelPaymentData
} from '@/types/payment.types'

// Create axios instance for payment API
const paymentApi = axios.create({
  baseURL: `${config.api.baseUrl}/payments`,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
paymentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
paymentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Payment API functions
 */
export const paymentApiService = {
  /**
   * Calculate payment amounts for a booking
   */
  async calculatePaymentAmounts(
    basePrice: number,
    nights: number
  ): Promise<HotelPaymentData> {
    try {
      const response = await paymentApi.post<HotelPaymentData>('/calculate', {
        basePrice,
        nights
      })
      return response.data
    } catch (error) {
      console.error('Failed to calculate payment amounts:', error)
      // Fallback calculation if API fails
      const baseAmount = basePrice * nights
      const taxes = Math.round(baseAmount * 0.12 * 100)
      const fees = 2500
      const securityDeposit = 5000
      const totalAmount = baseAmount * 100 + taxes + fees + securityDeposit

      return {
        baseAmount: baseAmount * 100,
        taxes,
        fees,
        securityDeposit,
        totalAmount,
        breakdown: [
          { description: `Room rate (${nights} nights)`, amount: baseAmount * 100, type: 'room' },
          { description: 'Taxes (12%)', amount: taxes, type: 'tax' },
          { description: 'Booking fee', amount: fees, type: 'fee' },
          { description: 'Security deposit (refundable)', amount: securityDeposit, type: 'deposit' }
        ],
        currency: 'USD',
        nights
      }
    }
  },

  /**
   * Create a new payment with preauthorization
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await paymentApi.post<PaymentResponse>('/create', request)
      return response.data
    } catch (error: any) {
      console.error('Payment creation failed:', error)
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'NETWORK_ERROR',
          message: error.response?.data?.error?.message || 'Failed to process payment',
          details: error.response?.data?.error?.details
        }
      }
    }
  },

  /**
   * Capture a preauthorized payment
   */
  async capturePayment(request: CapturePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await paymentApi.post<PaymentResponse>(
        `/capture/${request.paymentId}`,
        { amount: request.amount }
      )
      return response.data
    } catch (error: any) {
      console.error('Payment capture failed:', error)
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'CAPTURE_FAILED',
          message: error.response?.data?.error?.message || 'Failed to capture payment'
        }
      }
    }
  },

  /**
   * Cancel/void a preauthorized payment
   */
  async cancelPayment(request: CancelPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await paymentApi.post<PaymentResponse>(
        `/cancel/${request.paymentId}`,
        { reason: request.reason }
      )
      return response.data
    } catch (error: any) {
      console.error('Payment cancellation failed:', error)
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'CANCELLATION_FAILED',
          message: error.response?.data?.error?.message || 'Failed to cancel payment'
        }
      }
    }
  },

  /**
   * Refund a completed payment
   */
  async refundPayment(request: RefundPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await paymentApi.post<PaymentResponse>(
        `/refund/${request.paymentId}`,
        {
          amount: request.amount,
          reason: request.reason
        }
      )
      return response.data
    } catch (error: any) {
      console.error('Payment refund failed:', error)
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'REFUND_FAILED',
          message: error.response?.data?.error?.message || 'Failed to process refund'
        }
      }
    }
  },

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await paymentApi.get<PaymentResponse>(`/${paymentId}`)
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch payment:', error)
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'PAYMENT_NOT_FOUND',
          message: error.response?.data?.error?.message || 'Payment not found'
        }
      }
    }
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(): Promise<{ payments: PaymentIntent[] }> {
    try {
      const response = await paymentApi.get<{ payments: PaymentIntent[] }>('/history')
      return response.data
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
      return { payments: [] }
    }
  },

  /**
   * Verify payment status (for polling)
   */
  async verifyPaymentStatus(paymentId: string): Promise<{
    status: string
    canCapture: boolean
    canCancel: boolean
    expiresAt?: string
  }> {
    try {
      const response = await paymentApi.get(`/verify/${paymentId}`)
      return response.data
    } catch (error) {
      console.error('Failed to verify payment status:', error)
      return {
        status: 'unknown',
        canCapture: false,
        canCancel: false
      }
    }
  },

  /**
   * Simulate payment for demo/testing purposes
   */
  async simulatePayment(
    amount: number,
    scenario: 'success' | 'decline' | 'network_error' | '3ds_required' = 'success'
  ): Promise<PaymentResponse> {
    try {
      // This is for demonstration/testing only
      const mockPayment: PaymentIntent = {
        id: `mock_payment_${Date.now()}`,
        amount,
        currency: 'USD',
        status: scenario === 'success' ? 'authorized' : 'failed',
        paymentMethod: 'card',
        authorization: scenario === 'success' ? {
          id: `mock_auth_${Date.now()}`,
          amount,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          canCapture: true,
          canCancel: true
        } : undefined,
        booking: {
          bookingId: 'mock_booking',
          hotelId: 'mock_hotel',
          roomOfferId: 'mock_room',
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          guests: { adults: 2, children: 0 }
        },
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Simulate different scenarios
      switch (scenario) {
        case 'decline':
          return {
            success: false,
            error: {
              code: 'INVALID_CARD',
              message: 'Your card was declined',
              suggestion: 'Please try a different payment method'
            }
          }
        case 'network_error':
          throw new Error('Network error')
        case '3ds_required':
          return {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: '3D Secure authentication required',
              suggestion: 'Please complete the authentication with your bank'
            }
          }
        default:
          return {
            success: true,
            payment: mockPayment
          }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection error'
        }
      }
    }
  }
}

export default paymentApiService