import { Client, Environment, ApiError } from 'square'
import { config } from '@/config/environment'
import type {
  CreatePaymentRequest,
  PaymentResponse,
  CapturePaymentRequest,
  CancelPaymentRequest,
  RefundPaymentRequest,
  PaymentIntent,
  PaymentError,
  HotelPaymentData
} from '@/types/payment.types'

// Initialize Square client
const squareClient = new Client({
  accessToken: config.services.square.environment === 'sandbox'
    ? 'sandbox_access_token' // This would come from environment variables
    : 'production_access_token',
  environment: config.services.square.environment === 'sandbox'
    ? Environment.Sandbox
    : Environment.Production
})

class PaymentService {
  private readonly paymentsApi = squareClient.paymentsApi
  private readonly ordersApi = squareClient.ordersApi
  private readonly customersApi = squareClient.customersApi

  /**
   * Calculate payment amounts for hotel booking
   */
  calculatePaymentAmounts(basePrice: number, nights: number): HotelPaymentData {
    const baseAmount = basePrice * nights
    const taxes = Math.round(baseAmount * 0.12 * 100) // 12% tax in cents
    const fees = 2500 // $25 booking fee in cents
    const securityDeposit = 5000 // $50 security deposit in cents
    const totalAmount = baseAmount * 100 + taxes + fees + securityDeposit // Convert to cents

    return {
      baseAmount: baseAmount * 100, // Convert to cents
      taxes,
      fees,
      securityDeposit,
      totalAmount,
      breakdown: [
        { description: `Room rate (${nights} nights)`, amount: baseAmount * 100, type: 'room' },
        { description: 'Taxes', amount: taxes, type: 'tax' },
        { description: 'Booking fee', amount: fees, type: 'fee' },
        { description: 'Security deposit (refundable)', amount: securityDeposit, type: 'deposit' }
      ],
      currency: 'USD',
      nights
    }
  }

  /**
   * Create a payment with preauthorization for hotel booking
   */
  async createPaymentWithPreauth(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      // Generate unique idempotency key
      const idempotencyKey = `hotel-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create payment request with delayed capture
      const paymentRequest = {
        sourceId: request.sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(request.amount), // Amount in cents
          currency: request.currency.toUpperCase()
        },
        locationId: config.services.square.locationId,
        delayCapture: request.delayCapture ?? true, // Enable preauthorization
        delayDuration: request.delayDuration ?? 'PT168H', // 7 days default
        note: request.note || `Hotel booking for ${request.bookingDetails.hotelId}`,
        // Add verification token for 3D Secure if provided
        ...(request.verificationToken && {
          verificationToken: request.verificationToken
        }),
        // Add billing address if provided
        ...(request.billingAddress && {
          billingAddress: {
            addressLine1: request.billingAddress.addressLine1,
            addressLine2: request.billingAddress.addressLine2,
            locality: request.billingAddress.city,
            administrativeDistrictLevel1: request.billingAddress.state,
            postalCode: request.billingAddress.postalCode,
            country: request.billingAddress.country
          }
        })
      }

      const response = await this.paymentsApi.createPayment(paymentRequest)

      if (response.result.payment) {
        const payment = response.result.payment

        // Convert Square payment to our PaymentIntent format
        const paymentIntent: PaymentIntent = {
          id: payment.id!,
          amount: Number(payment.amountMoney!.amount!),
          currency: payment.amountMoney!.currency!,
          status: this.mapSquareStatus(payment.status!),
          paymentMethod: 'card', // TODO: Detect actual payment method
          authorization: payment.delayAction === 'CANCEL' ? {
            id: payment.id!,
            amount: Number(payment.amountMoney!.amount!),
            expiresAt: payment.delayedUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            canCapture: payment.status === 'APPROVED',
            canCancel: payment.status === 'APPROVED'
          } : undefined,
          booking: {
            bookingId: idempotencyKey,
            hotelId: request.bookingDetails.hotelId,
            roomOfferId: request.bookingDetails.roomOfferId,
            checkIn: request.bookingDetails.checkIn,
            checkOut: request.bookingDetails.checkOut,
            guests: {
              adults: request.bookingDetails.guests.adults.length,
              children: request.bookingDetails.guests.children.length
            }
          },
          customer: {
            firstName: request.bookingDetails.guests.adults[0]?.firstName || '',
            lastName: request.bookingDetails.guests.adults[0]?.lastName || '',
            email: request.bookingDetails.guests.adults[0]?.email || '',
            phone: request.bookingDetails.guests.adults[0]?.phone,
            address: request.billingAddress
          },
          createdAt: payment.createdAt!,
          updatedAt: payment.updatedAt!
        }

        return {
          success: true,
          payment: paymentIntent
        }
      }

      return {
        success: false,
        error: {
          code: 'PAYMENT_CREATION_FAILED',
          message: 'Failed to create payment'
        }
      }

    } catch (error) {
      console.error('Payment creation error:', error)
      return {
        success: false,
        error: this.handleSquareError(error)
      }
    }
  }

  /**
   * Capture a preauthorized payment
   */
  async capturePayment(request: CapturePaymentRequest): Promise<PaymentResponse> {
    try {
      // Get the payment first to check if it can be captured
      const getPaymentResponse = await this.paymentsApi.getPayment(request.paymentId)

      if (!getPaymentResponse.result.payment) {
        return {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found'
          }
        }
      }

      const payment = getPaymentResponse.result.payment

      // Check if payment can be captured
      if (payment.status !== 'APPROVED') {
        return {
          success: false,
          error: {
            code: 'PAYMENT_NOT_CAPTURABLE',
            message: 'Payment cannot be captured in current status'
          }
        }
      }

      // Complete the payment (capture the authorization)
      const completeRequest = {
        ...(request.amount && {
          // Partial capture if amount is specified
          amountMoney: {
            amount: BigInt(request.amount),
            currency: payment.amountMoney!.currency!
          }
        })
      }

      const response = await this.paymentsApi.completePayment(request.paymentId, completeRequest)

      if (response.result.payment) {
        const updatedPayment = response.result.payment

        const paymentIntent: PaymentIntent = {
          id: updatedPayment.id!,
          amount: Number(updatedPayment.amountMoney!.amount!),
          currency: updatedPayment.amountMoney!.currency!,
          status: this.mapSquareStatus(updatedPayment.status!),
          paymentMethod: 'card',
          booking: {} as any, // Would be populated from database
          customer: {} as any, // Would be populated from database
          createdAt: updatedPayment.createdAt!,
          updatedAt: updatedPayment.updatedAt!
        }

        return {
          success: true,
          payment: paymentIntent
        }
      }

      return {
        success: false,
        error: {
          code: 'CAPTURE_FAILED',
          message: 'Failed to capture payment'
        }
      }

    } catch (error) {
      console.error('Payment capture error:', error)
      return {
        success: false,
        error: this.handleSquareError(error)
      }
    }
  }

  /**
   * Cancel/void a preauthorized payment
   */
  async cancelPayment(request: CancelPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.paymentsApi.cancelPayment(request.paymentId)

      if (response.result.payment) {
        const cancelledPayment = response.result.payment

        const paymentIntent: PaymentIntent = {
          id: cancelledPayment.id!,
          amount: Number(cancelledPayment.amountMoney!.amount!),
          currency: cancelledPayment.amountMoney!.currency!,
          status: 'cancelled',
          paymentMethod: 'card',
          booking: {} as any, // Would be populated from database
          customer: {} as any, // Would be populated from database
          createdAt: cancelledPayment.createdAt!,
          updatedAt: cancelledPayment.updatedAt!
        }

        return {
          success: true,
          payment: paymentIntent
        }
      }

      return {
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message: 'Failed to cancel payment'
        }
      }

    } catch (error) {
      console.error('Payment cancellation error:', error)
      return {
        success: false,
        error: this.handleSquareError(error)
      }
    }
  }

  /**
   * Refund a completed payment
   */
  async refundPayment(request: RefundPaymentRequest): Promise<PaymentResponse> {
    try {
      const idempotencyKey = `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const refundRequest = {
        idempotencyKey,
        amountMoney: {
          amount: BigInt(request.amount),
          currency: 'USD' // TODO: Get from original payment
        },
        paymentId: request.paymentId,
        reason: request.reason || 'Customer requested refund'
      }

      const response = await squareClient.refundsApi.refundPayment(refundRequest)

      if (response.result.refund) {
        // Return success response
        return {
          success: true,
          payment: {
            id: response.result.refund.id!,
            amount: Number(response.result.refund.amountMoney!.amount!),
            currency: response.result.refund.amountMoney!.currency!,
            status: 'refunded',
            paymentMethod: 'card',
            booking: {} as any,
            customer: {} as any,
            createdAt: response.result.refund.createdAt!,
            updatedAt: response.result.refund.updatedAt!
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'REFUND_FAILED',
          message: 'Failed to process refund'
        }
      }

    } catch (error) {
      console.error('Refund error:', error)
      return {
        success: false,
        error: this.handleSquareError(error)
      }
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.paymentsApi.getPayment(paymentId)

      if (response.result.payment) {
        const payment = response.result.payment

        const paymentIntent: PaymentIntent = {
          id: payment.id!,
          amount: Number(payment.amountMoney!.amount!),
          currency: payment.amountMoney!.currency!,
          status: this.mapSquareStatus(payment.status!),
          paymentMethod: 'card',
          booking: {} as any, // Would be populated from database
          customer: {} as any, // Would be populated from database
          createdAt: payment.createdAt!,
          updatedAt: payment.updatedAt!
        }

        return {
          success: true,
          payment: paymentIntent
        }
      }

      return {
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      }

    } catch (error) {
      console.error('Get payment error:', error)
      return {
        success: false,
        error: this.handleSquareError(error)
      }
    }
  }

  /**
   * Map Square payment status to our payment status
   */
  private mapSquareStatus(squareStatus: string): PaymentStatus {
    switch (squareStatus) {
      case 'APPROVED':
        return 'authorized'
      case 'COMPLETED':
        return 'captured'
      case 'PENDING':
        return 'processing'
      case 'CANCELED':
        return 'cancelled'
      case 'FAILED':
        return 'failed'
      default:
        return 'pending'
    }
  }

  /**
   * Handle Square API errors and convert to our error format
   */
  private handleSquareError(error: any): PaymentError {
    if (error instanceof ApiError) {
      const squareError = error.errors?.[0]

      if (squareError) {
        // Map Square error codes to our error codes
        switch (squareError.code) {
          case 'CARD_DECLINED':
            return {
              code: 'INVALID_CARD',
              message: 'Your card was declined. Please try a different payment method.',
              suggestion: 'Try using a different card or contact your bank.'
            }
          case 'INSUFFICIENT_FUNDS':
            return {
              code: 'INSUFFICIENT_FUNDS',
              message: 'Insufficient funds on your card.',
              suggestion: 'Please check your account balance or use a different payment method.'
            }
          case 'EXPIRED_CARD':
            return {
              code: 'EXPIRED_CARD',
              message: 'Your card has expired.',
              suggestion: 'Please use a different card or update your payment information.'
            }
          case 'CVV_FAILURE':
            return {
              code: 'INVALID_CARD',
              message: 'The security code (CVV) you entered is incorrect.',
              field: 'cvv',
              suggestion: 'Please check the 3-digit code on the back of your card.'
            }
          case 'ADDRESS_VERIFICATION_FAILURE':
            return {
              code: 'INVALID_CARD',
              message: 'The billing address you entered does not match your card.',
              field: 'billingAddress',
              suggestion: 'Please verify your billing address matches the one on file with your bank.'
            }
          default:
            return {
              code: 'UNKNOWN_ERROR',
              message: squareError.detail || 'An unexpected error occurred.',
              suggestion: 'Please try again or contact support if the problem persists.'
            }
        }
      }
    }

    // Network or other errors
    if (error.message?.includes('network') || error.code === 'ENOTFOUND') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error. Please check your internet connection.',
        suggestion: 'Please try again in a moment.'
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while processing your payment.',
      suggestion: 'Please try again or contact support if the problem persists.'
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
export default paymentService