import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Lock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SquarePaymentForm from '@/components/payment/SquarePaymentForm'
import PaymentSummary from '@/components/payment/PaymentSummary'
import { useHotelDetails } from '@/hooks/useLiteAPI'
import { useCalculatePayment, usePaymentForm } from '@/hooks/usePayment'
import type {
  PaymentFormData,
  BillingAddress,
  CreatePaymentRequest,
  GuestInfo
} from '@/types/payment.types'
import { differenceInDays } from 'date-fns'

interface PaymentPageState {
  hotelId: string
  roomOfferId: string
  checkIn: string
  checkOut: string
  guestInfo: GuestInfo
}

const PaymentPage = () => {
  const { prebookId } = useParams<{ prebookId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Get booking details from location state or URL params
  const bookingDetails = location.state as PaymentPageState

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [billingAddress, setBillingAddress] = useState<BillingAddress | undefined>()

  // API hooks
  const { data: hotelDetails, isLoading: hotelLoading, error: hotelError } = useHotelDetails(
    bookingDetails?.hotelId || '',
    !!bookingDetails?.hotelId
  )

  const basePrice = hotelDetails?.hotel.offers.find(
    offer => offer.offerId === bookingDetails?.roomOfferId
  )?.pricing.basePrice || 0

  const nights = bookingDetails
    ? differenceInDays(new Date(bookingDetails.checkOut), new Date(bookingDetails.checkIn))
    : 0

  const { data: paymentData, isLoading: paymentCalculationLoading } = useCalculatePayment(
    basePrice,
    nights
  )

  const { processPayment } = usePaymentForm()

  // Redirect if no booking details
  useEffect(() => {
    if (!prebookId && !bookingDetails) {
      navigate('/')
    }
  }, [prebookId, bookingDetails, navigate])

  // Handle payment submission
  const handlePaymentSuccess = async (formData: PaymentFormData) => {
    if (!bookingDetails || !hotelDetails || !paymentData) {
      setPaymentError('Missing booking information')
      return
    }

    setPaymentStatus('processing')
    setPaymentError(null)

    try {
      const paymentRequest: CreatePaymentRequest = {
        amount: paymentData.totalAmount,
        currency: 'USD',
        sourceId: formData.token.token!,
        verificationToken: formData.verifiedBuyer?.token,
        bookingDetails: {
          hotelId: bookingDetails.hotelId,
          roomOfferId: bookingDetails.roomOfferId,
          checkIn: bookingDetails.checkIn,
          checkOut: bookingDetails.checkOut,
          guests: bookingDetails.guestInfo
        },
        billingAddress: formData.billingAddress || billingAddress,
        delayCapture: true, // Enable preauthorization
        delayDuration: 'PT168H', // 7 days
        note: `Hotel booking: ${hotelDetails.hotel.name}`
      }

      // For demo purposes, we'll simulate the payment
      const response = await processPayment(paymentRequest, {
        simulate: true,
        simulationScenario: 'success'
      })

      if (response.success && response.payment) {
        setPaymentId(response.payment.id)
        setPaymentStatus('success')

        // Navigate to confirmation page after a short delay
        setTimeout(() => {
          navigate(`/booking-confirmation/${response.payment!.id}`, {
            state: {
              payment: response.payment,
              booking: bookingDetails,
              hotel: hotelDetails.hotel
            }
          })
        }, 2000)
      } else {
        setPaymentStatus('error')
        setPaymentError(response.error?.message || 'Payment failed')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setPaymentStatus('error')
      setPaymentError(error.message || 'An unexpected error occurred')
    }
  }

  const handlePaymentError = (error: any) => {
    setPaymentStatus('error')
    setPaymentError(error.message || 'Payment processing failed')
  }

  // Loading state
  if (hotelLoading || paymentCalculationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (hotelError || !hotelDetails || !bookingDetails || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Alert className="max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Failed to load payment details. Please try again or contact support.
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const selectedRoomOffer = hotelDetails.hotel.offers.find(
    offer => offer.offerId === bookingDetails.roomOfferId
  )

  if (!selectedRoomOffer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Alert className="max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Room offer not found. Please select a room again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
            disabled={paymentStatus === 'processing'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to booking
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Secure Payment</h1>
          </div>
          <p className="text-gray-600">
            Complete your booking for {hotelDetails.hotel.name}
          </p>
        </div>

        {/* Success State */}
        {paymentStatus === 'success' && (
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Authorized!</h2>
              <p className="text-gray-600 mb-4">
                Your payment has been authorized successfully. You will be redirected to your booking confirmation.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to confirmation...
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {paymentStatus !== 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <div className="space-y-6">
              {/* Payment Error */}
              {paymentStatus === 'error' && paymentError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {paymentError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Processing State */}
              {paymentStatus === 'processing' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Processing your payment securely. Please do not refresh or close this page.
                  </AlertDescription>
                </Alert>
              )}

              {/* Square Payment Form */}
              <SquarePaymentForm
                amount={paymentData.totalAmount}
                currency="USD"
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                isProcessing={paymentStatus === 'processing'}
                billingAddress={billingAddress}
                verificationDetails={{
                  amount: (paymentData.totalAmount / 100).toFixed(2),
                  billingContact: {
                    familyName: bookingDetails.guestInfo.adults[0]?.lastName || '',
                    givenName: bookingDetails.guestInfo.adults[0]?.firstName || '',
                    email: bookingDetails.guestInfo.adults[0]?.email || '',
                    country: 'US'
                  },
                  currencyCode: 'USD',
                  intent: 'CHARGE'
                }}
              />

              {/* Security Notice */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Lock className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Your payment is secure</p>
                      <p className="text-xs text-gray-600">
                        256-bit SSL encryption • PCI DSS compliant • Fraud protection
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div>
              <PaymentSummary
                hotel={hotelDetails.hotel}
                roomOffer={selectedRoomOffer}
                checkIn={new Date(bookingDetails.checkIn)}
                checkOut={new Date(bookingDetails.checkOut)}
                guestInfo={bookingDetails.guestInfo}
                paymentData={paymentData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentPage