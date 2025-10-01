import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, ArrowLeft, Shield, Phone } from 'lucide-react'

interface PaymentErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
  onCancel?: () => void
}

interface PaymentErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
  retryCount: number
}

class PaymentErrorBoundary extends Component<PaymentErrorBoundaryProps, PaymentErrorBoundaryState> {
  private maxRetries = 3

  constructor(props: PaymentErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<PaymentErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log payment errors to monitoring service
    console.error('Payment Error Boundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // In production, send to error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          component: 'PaymentErrorBoundary',
          errorBoundary: true
        },
        extra: errorInfo
      })
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))

      // Call parent retry function if provided
      if (this.props.onRetry) {
        this.props.onRetry()
      }
    }
  }

  handleCancel = () => {
    if (this.props.onCancel) {
      this.props.onCancel()
    } else {
      // Default cancel behavior - go back or redirect to home
      if (typeof window !== 'undefined') {
        window.history.back()
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const error = this.state.error
      const canRetry = this.state.retryCount < this.maxRetries

      // Categorize error types for better user experience
      const getErrorType = (error: Error | null) => {
        if (!error) return 'unknown'

        const message = error.message.toLowerCase()
        if (message.includes('network') || message.includes('fetch')) {
          return 'network'
        }
        if (message.includes('payment') || message.includes('card')) {
          return 'payment'
        }
        if (message.includes('timeout')) {
          return 'timeout'
        }
        if (message.includes('square') || message.includes('sdk')) {
          return 'payment_provider'
        }
        return 'unknown'
      }

      const errorType = getErrorType(error)

      const getErrorContent = (type: string) => {
        switch (type) {
          case 'network':
            return {
              title: 'Connection Problem',
              message: 'We\'re having trouble connecting to our payment servers. Please check your internet connection and try again.',
              suggestion: 'Check your internet connection and try again in a moment.',
              canRetry: true
            }
          case 'payment':
            return {
              title: 'Payment Error',
              message: 'There was an issue processing your payment. This could be due to card details or bank restrictions.',
              suggestion: 'Please verify your payment information or try a different payment method.',
              canRetry: true
            }
          case 'timeout':
            return {
              title: 'Request Timeout',
              message: 'The payment request took too long to process. Your card has not been charged.',
              suggestion: 'Please try again. If the problem persists, contact support.',
              canRetry: true
            }
          case 'payment_provider':
            return {
              title: 'Payment Service Issue',
              message: 'Our payment service is temporarily unavailable. No charges have been made.',
              suggestion: 'Please wait a few minutes and try again, or contact support for assistance.',
              canRetry: false
            }
          default:
            return {
              title: 'Something Went Wrong',
              message: 'An unexpected error occurred while processing your payment. Your card has not been charged.',
              suggestion: 'Please try again or contact support if the problem continues.',
              canRetry: true
            }
        }
      }

      const errorContent = getErrorContent(errorType)

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">
                {errorContent.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Description */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errorContent.message}
                </AlertDescription>
              </Alert>

              {/* Suggestion */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>What you can do:</strong> {errorContent.suggestion}
                </p>
              </div>

              {/* Retry Information */}
              {canRetry && (
                <div className="text-center text-sm text-gray-600">
                  Retry attempt: {this.state.retryCount} of {this.maxRetries}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry && errorContent.canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={this.handleCancel}
                  className="w-full"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>

              {/* Safety Assurance */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Your payment is safe</p>
                    <p>No charges have been made to your card. All payment data is securely encrypted.</p>
                  </div>
                </div>
              </div>

              {/* Support Contact */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Need help? Contact our support team
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <a
                    href="tel:+1-555-0123"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    (555) 012-3456
                  </a>
                  <a
                    href="mailto:support@vibebookings.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@vibebookings.com
                  </a>
                </div>
              </div>

              {/* Error Details (in development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Developer Information (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <p><strong>Error:</strong> {error.message}</p>
                    <p><strong>Stack:</strong></p>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                    {this.state.errorInfo && (
                      <>
                        <p><strong>Component Stack:</strong></p>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component wrapper for easier usage
export const withPaymentErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<PaymentErrorBoundaryProps, 'children'>
) => {
  return (props: P) => (
    <PaymentErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </PaymentErrorBoundary>
  )
}

export default PaymentErrorBoundary