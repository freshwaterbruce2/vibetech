import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApiService } from '@/api/payment.api'
import type {
  CreatePaymentRequest,
  PaymentResponse,
  CapturePaymentRequest,
  CancelPaymentRequest,
  RefundPaymentRequest,
  PaymentIntent,
  HotelPaymentData
} from '@/types/payment.types'

// Query keys for payment operations
export const paymentKeys = {
  all: ['payments'] as const,
  payment: (id: string) => [...paymentKeys.all, 'payment', id] as const,
  history: () => [...paymentKeys.all, 'history'] as const,
  status: (id: string) => [...paymentKeys.all, 'status', id] as const,
  calculate: (basePrice: number, nights: number) =>
    [...paymentKeys.all, 'calculate', basePrice, nights] as const,
}

/**
 * Hook to calculate payment amounts for a booking
 */
export const useCalculatePayment = (basePrice: number, nights: number) => {
  return useQuery({
    queryKey: paymentKeys.calculate(basePrice, nights),
    queryFn: () => paymentApiService.calculatePaymentAmounts(basePrice, nights),
    enabled: basePrice > 0 && nights > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to create a payment with preauthorization
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreatePaymentRequest) =>
      paymentApiService.createPayment(request),
    onSuccess: (data) => {
      if (data.success && data.payment) {
        // Cache the payment data
        queryClient.setQueryData(
          paymentKeys.payment(data.payment.id),
          data
        )

        // Invalidate payment history to include the new payment
        queryClient.invalidateQueries({
          queryKey: paymentKeys.history()
        })
      }
    },
    onError: (error) => {
      console.error('Payment creation failed:', error)
    }
  })
}

/**
 * Hook to capture a preauthorized payment
 */
export const useCapturePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CapturePaymentRequest) =>
      paymentApiService.capturePayment(request),
    onSuccess: (data, variables) => {
      if (data.success && data.payment) {
        // Update cached payment data
        queryClient.setQueryData(
          paymentKeys.payment(variables.paymentId),
          data
        )

        // Invalidate status queries
        queryClient.invalidateQueries({
          queryKey: paymentKeys.status(variables.paymentId)
        })
      }
    },
    onError: (error) => {
      console.error('Payment capture failed:', error)
    }
  })
}

/**
 * Hook to cancel a preauthorized payment
 */
export const useCancelPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CancelPaymentRequest) =>
      paymentApiService.cancelPayment(request),
    onSuccess: (data, variables) => {
      if (data.success && data.payment) {
        // Update cached payment data
        queryClient.setQueryData(
          paymentKeys.payment(variables.paymentId),
          data
        )

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: paymentKeys.status(variables.paymentId)
        })
      }
    },
    onError: (error) => {
      console.error('Payment cancellation failed:', error)
    }
  })
}

/**
 * Hook to refund a completed payment
 */
export const useRefundPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: RefundPaymentRequest) =>
      paymentApiService.refundPayment(request),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate payment history to show refund
        queryClient.invalidateQueries({
          queryKey: paymentKeys.history()
        })

        // Invalidate payment status
        queryClient.invalidateQueries({
          queryKey: paymentKeys.status(variables.paymentId)
        })
      }
    },
    onError: (error) => {
      console.error('Payment refund failed:', error)
    }
  })
}

/**
 * Hook to get payment details by ID
 */
export const usePayment = (paymentId: string, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.payment(paymentId),
    queryFn: () => paymentApiService.getPayment(paymentId),
    enabled: !!paymentId && enabled,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: (data, query) => {
      // Auto-refresh if payment is still processing
      if (data?.payment?.status === 'processing' || data?.payment?.status === 'pending') {
        return 5000 // 5 seconds
      }
      return false
    }
  })
}

/**
 * Hook to get payment history for the current user
 */
export const usePaymentHistory = () => {
  return useQuery({
    queryKey: paymentKeys.history(),
    queryFn: () => paymentApiService.getPaymentHistory(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to verify payment status (for polling)
 */
export const usePaymentStatus = (paymentId: string, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.status(paymentId),
    queryFn: () => paymentApiService.verifyPaymentStatus(paymentId),
    enabled: !!paymentId && enabled,
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: false,
    staleTime: 1000 * 5 // 5 seconds
  })
}

/**
 * Hook to simulate payment for demo/testing
 */
export const useSimulatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      amount,
      scenario = 'success'
    }: {
      amount: number
      scenario?: 'success' | 'decline' | 'network_error' | '3ds_required'
    }) =>
      paymentApiService.simulatePayment(amount, scenario),
    onSuccess: (data) => {
      if (data.success && data.payment) {
        // Cache the simulated payment
        queryClient.setQueryData(
          paymentKeys.payment(data.payment.id),
          data
        )
      }
    },
    onError: (error) => {
      console.error('Payment simulation failed:', error)
    }
  })
}

/**
 * Custom hook for managing payment flow state
 */
export const usePaymentFlow = () => {
  const createPayment = useCreatePayment()
  const capturePayment = useCapturePayment()
  const cancelPayment = useCancelPayment()
  const simulatePayment = useSimulatePayment()

  const isProcessing = createPayment.isPending ||
                     capturePayment.isPending ||
                     cancelPayment.isPending ||
                     simulatePayment.isPending

  const hasError = createPayment.error ||
                   capturePayment.error ||
                   cancelPayment.error ||
                   simulatePayment.error

  const resetErrors = () => {
    createPayment.reset()
    capturePayment.reset()
    cancelPayment.reset()
    simulatePayment.reset()
  }

  return {
    createPayment: createPayment.mutateAsync,
    capturePayment: capturePayment.mutateAsync,
    cancelPayment: cancelPayment.mutateAsync,
    simulatePayment: simulatePayment.mutateAsync,
    isProcessing,
    hasError,
    resetErrors,
    // Individual states for granular control
    createState: {
      isLoading: createPayment.isPending,
      error: createPayment.error,
      data: createPayment.data,
      reset: createPayment.reset
    },
    captureState: {
      isLoading: capturePayment.isPending,
      error: capturePayment.error,
      data: capturePayment.data,
      reset: capturePayment.reset
    },
    cancelState: {
      isLoading: cancelPayment.isPending,
      error: cancelPayment.error,
      data: cancelPayment.data,
      reset: cancelPayment.reset
    },
    simulateState: {
      isLoading: simulatePayment.isPending,
      error: simulatePayment.error,
      data: simulatePayment.data,
      reset: simulatePayment.reset
    }
  }
}

/**
 * Hook for payment form validation and state management
 */
export const usePaymentForm = () => {
  const { createPayment, simulatePayment } = usePaymentFlow()

  const processPayment = async (
    paymentData: CreatePaymentRequest,
    options?: {
      simulate?: boolean
      simulationScenario?: 'success' | 'decline' | 'network_error' | '3ds_required'
    }
  ): Promise<PaymentResponse> => {
    try {
      if (options?.simulate) {
        return await simulatePayment({
          amount: paymentData.amount,
          scenario: options.simulationScenario
        })
      }

      return await createPayment(paymentData)
    } catch (error: any) {
      // Convert error to PaymentResponse format
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Payment processing failed'
        }
      }
    }
  }

  return {
    processPayment
  }
}

export default usePaymentFlow