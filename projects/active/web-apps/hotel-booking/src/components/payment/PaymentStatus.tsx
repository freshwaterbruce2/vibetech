import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Loader2,
  XCircle,
  RefreshCw,
  Shield,
  Eye,
  AlertTriangle,
  Info
} from 'lucide-react'
import type { PaymentStatus as PaymentStatusType, PaymentError } from '@/types/payment.types'

interface PaymentStatusProps {
  status: PaymentStatusType
  paymentId?: string
  amount?: number
  currency?: string
  error?: PaymentError | null
  onRetry?: () => void
  onCancel?: () => void
  onViewDetails?: () => void
  className?: string
  showProgress?: boolean
  expiresAt?: string
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  paymentId,
  amount,
  currency = 'USD',
  error,
  onRetry,
  onCancel,
  onViewDetails,
  className,
  showProgress = false,
  expiresAt
}) => {
  // Format amount for display
  const formatAmount = (cents: number) => {
    return `${currency === 'USD' ? '$' : currency} ${(cents / 100).toFixed(2)}`
  }

  // Calculate expiration time remaining
  const getTimeRemaining = () => {
    if (!expiresAt) return null

    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()

    if (diffMs <= 0) return 'Expired'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days !== 1 ? 's' : ''} remaining`
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }

    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`
  }

  // Get status-specific content
  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Payment Pending',
          description: 'Your payment is being initialized...',
          color: 'border-yellow-200 bg-yellow-50',
          titleColor: 'text-yellow-800',
          descColor: 'text-yellow-600'
        }

      case 'processing':
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />,
          title: 'Processing Payment',
          description: 'Please wait while we securely process your payment. Do not refresh or close this page.',
          color: 'border-blue-200 bg-blue-50',
          titleColor: 'text-blue-800',
          descColor: 'text-blue-600'
        }

      case 'authorized':
        return {
          icon: <Shield className="w-8 h-8 text-green-500" />,
          title: 'Payment Authorized',
          description: 'Your payment has been authorized successfully. We\'ve reserved the funds and will charge your card at check-in.',
          color: 'border-green-200 bg-green-50',
          titleColor: 'text-green-800',
          descColor: 'text-green-600'
        }

      case 'captured':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Payment Completed',
          description: 'Your payment has been successfully processed and your booking is confirmed.',
          color: 'border-green-200 bg-green-50',
          titleColor: 'text-green-800',
          descColor: 'text-green-600'
        }

      case 'failed':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: 'Payment Failed',
          description: error?.message || 'We couldn\'t process your payment. Please try again or use a different payment method.',
          color: 'border-red-200 bg-red-50',
          titleColor: 'text-red-800',
          descColor: 'text-red-600'
        }

      case 'cancelled':
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-500" />,
          title: 'Payment Cancelled',
          description: 'The payment was cancelled. No charges have been made to your account.',
          color: 'border-gray-200 bg-gray-50',
          titleColor: 'text-gray-800',
          descColor: 'text-gray-600'
        }

      case 'refunded':
        return {
          icon: <RefreshCw className="w-8 h-8 text-blue-500" />,
          title: 'Payment Refunded',
          description: 'Your payment has been refunded. Please allow 3-5 business days for the refund to appear in your account.',
          color: 'border-blue-200 bg-blue-50',
          titleColor: 'text-blue-800',
          descColor: 'text-blue-600'
        }

      default:
        return {
          icon: <CreditCard className="w-8 h-8 text-gray-500" />,
          title: 'Payment Status Unknown',
          description: 'We\'re checking the status of your payment...',
          color: 'border-gray-200 bg-gray-50',
          titleColor: 'text-gray-800',
          descColor: 'text-gray-600'
        }
    }
  }

  const statusContent = getStatusContent()
  const timeRemaining = getTimeRemaining()

  return (
    <Card className={`${statusContent.color} ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          {statusContent.icon}
          <div>
            <h3 className={`text-lg font-semibold ${statusContent.titleColor}`}>
              {statusContent.title}
            </h3>
            {paymentId && (
              <p className="text-xs text-gray-500 font-normal">
                ID: {paymentId}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Description */}
        <p className={`text-sm ${statusContent.descColor}`}>
          {statusContent.description}
        </p>

        {/* Progress Bar for Processing */}
        {showProgress && (status === 'processing' || status === 'pending') && (
          <div className="space-y-2">
            <Progress value={status === 'processing' ? 75 : 25} className="w-full" />
            <p className="text-xs text-gray-500 text-center">
              {status === 'processing' ? 'Verifying payment details...' : 'Initializing payment...'}
            </p>
          </div>
        )}

        {/* Amount Display */}
        {amount && (
          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Amount:</span>
            <span className="text-lg font-bold">{formatAmount(amount)}</span>
          </div>
        )}

        {/* Authorization Expiration */}
        {status === 'authorized' && timeRemaining && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Authorization expires:</strong> {timeRemaining}
              <br />
              <span className="text-xs">
                You must check in before this time or the authorization will be cancelled.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Details */}
        {error && status === 'failed' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error.suggestion && (
                  <div className="text-sm">
                    <strong>Suggestion:</strong> {error.suggestion}
                  </div>
                )}
                {error.field && (
                  <div className="text-sm">
                    <strong>Issue with:</strong> {error.field}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge
            variant={
              status === 'captured' || status === 'authorized' ? 'default' :
              status === 'failed' ? 'destructive' :
              status === 'cancelled' ? 'secondary' :
              'outline'
            }
            className="uppercase"
          >
            {status.replace('_', ' ')}
          </Badge>

          {/* Timestamp */}
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Retry Button for Failed Payments */}
          {status === 'failed' && onRetry && (
            <Button onClick={onRetry} size="sm" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}

          {/* Cancel Button for Processing/Authorized */}
          {(status === 'processing' || status === 'authorized') && onCancel && (
            <Button variant="outline" onClick={onCancel} size="sm">
              Cancel Payment
            </Button>
          )}

          {/* View Details Button */}
          {onViewDetails && paymentId && (
            <Button variant="outline" onClick={onViewDetails} size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          )}
        </div>

        {/* Additional Information */}
        {status === 'authorized' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your card has been authorized for the total amount</li>
                  <li>You'll only be charged when you check in at the hotel</li>
                  <li>You can cancel this reservation before check-in</li>
                  <li>The authorization will automatically expire in 7 days</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentStatus