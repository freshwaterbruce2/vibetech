import React, { useState } from 'react'
import {
  PaymentForm,
  CreditCard,
  ApplePay,
  GooglePay,
  GiftCard
} from 'react-square-web-payments-sdk'
import type { TokenResult, VerifyBuyerResponseDetails } from '@square/web-payments-sdk-types'
import { config } from '@/config/environment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, CreditCard as CreditCardIcon, Smartphone, Gift, AlertCircle } from 'lucide-react'
import type {
  PaymentFormData,
  BillingAddress,
  VerificationDetails,
  PaymentError
} from '@/types/payment.types'

interface SquarePaymentFormProps {
  amount: number
  currency: string
  onPaymentSuccess: (data: PaymentFormData) => void
  onPaymentError: (error: PaymentError) => void
  isProcessing?: boolean
  billingAddress?: BillingAddress
  className?: string
  verificationDetails?: VerificationDetails
}

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  isProcessing = false,
  billingAddress,
  className,
  verificationDetails
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | 'gift_card'>('card')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle successful tokenization
  const handleCardTokenizeResponseReceived = async (
    token: TokenResult,
    verifiedBuyer: VerifyBuyerResponseDetails
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const paymentData: PaymentFormData = {
        token,
        verifiedBuyer,
        billingAddress
      }

      await onPaymentSuccess(paymentData)
    } catch (error: any) {
      console.error('Payment processing error:', error)
      onPaymentError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Payment processing failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle payment errors
  const handlePaymentError = (error: any) => {
    console.error('Square payment error:', error)
    setError(error.message || 'Payment processing failed')

    // Map Square errors to our error format
    let paymentError: PaymentError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred'
    }

    if (error.type === 'VALIDATION_ERROR') {
      paymentError = {
        code: 'INVALID_CARD',
        message: 'Please check your payment information',
        field: error.field
      }
    } else if (error.type === 'PAYMENT_METHOD_ERROR') {
      paymentError = {
        code: 'INVALID_CARD',
        message: 'This payment method is not supported'
      }
    }

    onPaymentError(paymentError)
  }

  // Check if Square configuration is available
  if (!config.services.square.applicationId || !config.services.square.locationId) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Alert className="max-w-md">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Payment processing is temporarily unavailable. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment method selector */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Choose payment method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('card')}
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={isProcessing || isLoading}
            >
              <CreditCardIcon className="w-5 h-5" />
              <span className="text-xs">Card</span>
            </Button>

            <Button
              variant={selectedPaymentMethod === 'apple_pay' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('apple_pay')}
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={isProcessing || isLoading}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs">Apple Pay</span>
            </Button>

            <Button
              variant={selectedPaymentMethod === 'google_pay' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('google_pay')}
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={isProcessing || isLoading}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs">Google Pay</span>
            </Button>

            <Button
              variant={selectedPaymentMethod === 'gift_card' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('gift_card')}
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={isProcessing || isLoading}
            >
              <Gift className="w-5 h-5" />
              <span className="text-xs">Gift Card</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Error display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Payment processing indicator */}
        {(isProcessing || isLoading) && (
          <Alert>
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription>
              Processing your payment securely...
            </AlertDescription>
          </Alert>
        )}

        {/* Square Payment Form */}
        <PaymentForm
          applicationId={config.services.square.applicationId}
          locationId={config.services.square.locationId}
          cardTokenizeResponseReceived={handleCardTokenizeResponseReceived}
          createVerificationDetails={() => verificationDetails || {
            amount: (amount / 100).toFixed(2),
            billingContact: {
              familyName: billingAddress?.addressLine1 || '',
              givenName: billingAddress?.city || '',
              email: '',
              country: billingAddress?.country || 'US',
              region: billingAddress?.state || '',
              city: billingAddress?.city || '',
              addressLines: billingAddress ? [billingAddress.addressLine1] : [],
              postalCode: billingAddress?.postalCode || ''
            },
            currencyCode: currency.toUpperCase(),
            intent: 'CHARGE'
          }}
          createPaymentRequest={() => ({
            countryCode: 'US',
            currencyCode: currency.toUpperCase(),
            total: {
              amount: (amount / 100).toFixed(2),
              label: 'Hotel Booking',
              pending: false
            }
          })}
          overrides={{
            applicationId: config.services.square.applicationId,
            locationId: config.services.square.locationId
          }}
        >
          {/* Credit Card */}
          {selectedPaymentMethod === 'card' && (
            <div className="space-y-4">
              <CreditCard
                includeInputLabels
                style={{
                  input: {
                    fontSize: '14px',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  },
                  '.message-text': {
                    color: '#dc2626'
                  }
                }}
                disabled={isProcessing || isLoading}
                callbacks={{
                  cardNonceResponseReceived: handleCardTokenizeResponseReceived,
                  errorReceived: handlePaymentError
                }}
              />

              <div className="text-xs text-gray-600">
                Your payment information is encrypted and secure. We never store your card details.
              </div>
            </div>
          )}

          {/* Apple Pay */}
          {selectedPaymentMethod === 'apple_pay' && (
            <ApplePay
              callbacks={{
                cardNonceResponseReceived: handleCardTokenizeResponseReceived,
                errorReceived: handlePaymentError
              }}
              disabled={isProcessing || isLoading}
            />
          )}

          {/* Google Pay */}
          {selectedPaymentMethod === 'google_pay' && (
            <GooglePay
              callbacks={{
                cardNonceResponseReceived: handleCardTokenizeResponseReceived,
                errorReceived: handlePaymentError
              }}
              disabled={isProcessing || isLoading}
            />
          )}

          {/* Gift Card */}
          {selectedPaymentMethod === 'gift_card' && (
            <GiftCard
              callbacks={{
                cardNonceResponseReceived: handleCardTokenizeResponseReceived,
                errorReceived: handlePaymentError
              }}
              disabled={isProcessing || isLoading}
            />
          )}
        </PaymentForm>

        {/* Security information */}
        <div className="text-xs text-gray-600 border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium">Secure Payment</span>
          </div>
          <p>
            This is a secure, encrypted payment. Your financial information is protected by Square's
            advanced security measures and PCI DSS compliance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SquarePaymentForm