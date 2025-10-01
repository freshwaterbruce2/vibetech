import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useHotelDetails, usePrebookRoom } from '@/hooks/useLiteAPI'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DateSelector from '@/components/booking/DateSelector'
import GuestSelector from '@/components/booking/GuestSelector'
import GuestInformationForm from '@/components/booking/GuestInformationForm'
import BookingSummary from '@/components/booking/BookingSummary'
import type { RoomOffer } from '@/types/liteapi'
import { addDays, startOfDay } from 'date-fns'

const BookingPage = () => {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>()
  const navigate = useNavigate()

  // Booking state
  const [checkIn, setCheckIn] = useState<Date>(startOfDay(new Date()))
  const [checkOut, setCheckOut] = useState<Date>(addDays(startOfDay(new Date()), 1))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState<'details' | 'guests' | 'summary'>('details')
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null)
  const [guestInfo, setGuestInfo] = useState<any>(null)

  // API hooks
  const { data: hotelDetails, isLoading: hotelLoading, error: hotelError } = useHotelDetails(hotelId || '', !!hotelId)
  const prebookMutation = usePrebookRoom()

  // Find the selected room offer
  const selectedRoomOffer = hotelDetails?.hotel.offers.find(offer => offer.offerId === roomId)

  // Check availability when dates or guests change
  useEffect(() => {
    if (hotelDetails && selectedRoomOffer && checkIn && checkOut) {
      checkAvailability()
    }
  }, [checkIn, checkOut, adults, children, hotelDetails, selectedRoomOffer])

  const checkAvailability = async () => {
    setAvailabilityStatus('checking')
    setAvailabilityChecked(false)

    // Simulate availability check (in real app, this would be an API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate some availability logic
      const isAvailable = Math.random() > 0.1 // 90% chance available
      setAvailabilityStatus(isAvailable ? 'available' : 'unavailable')
      setAvailabilityChecked(true)
    } catch (error) {
      setAvailabilityStatus('unavailable')
      setAvailabilityChecked(true)
    }
  }

  const handleDateChange = (newCheckIn: Date, newCheckOut: Date) => {
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
    setAvailabilityChecked(false)
  }

  const handleGuestChange = (newAdults: number, newChildren: number[]) => {
    setAdults(newAdults)
    setChildren(newChildren)
    setAvailabilityChecked(false)
  }

  const handleProceedToPayment = async () => {
    if (!selectedRoomOffer || !hotelDetails || !guestInfo) return

    try {
      // Generate a temporary prebook ID for demo purposes
      const prebookId = `prebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Prepare booking data for payment page
      const bookingData = {
        hotelId: hotelDetails.hotel.id,
        roomOfferId: selectedRoomOffer.offerId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guestInfo: guestInfo
      }

      // Navigate to payment page with booking data
      navigate(`/payment/${prebookId}`, {
        state: bookingData
      })
    } catch (error) {
      console.error('Navigation to payment failed:', error)
    }
  }

  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hotelError || !hotelDetails || !selectedRoomOffer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Alert className="max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Failed to load booking details. Please try again or select a different room.
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to hotel details
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const canProceedToGuests = availabilityStatus === 'available' && availabilityChecked
  const canProceedToSummary = canProceedToGuests && guestInfo

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to hotel details
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">
            {hotelDetails.hotel.name} • {selectedRoomOffer.roomType.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as 'details' | 'guests' | 'summary')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Booking Details</TabsTrigger>
                <TabsTrigger value="guests" disabled={!canProceedToGuests}>Guest Information</TabsTrigger>
                <TabsTrigger value="summary" disabled={!canProceedToSummary}>Review & Book</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                {/* Date Selection */}
                <DateSelector
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onDateChange={handleDateChange}
                />

                {/* Guest Selection */}
                <GuestSelector
                  adults={adults}
                  children={children}
                  onGuestChange={handleGuestChange}
                  maxGuests={selectedRoomOffer.roomType.maxOccupancy}
                />

                {/* Availability Status */}
                {availabilityStatus === 'checking' && (
                  <Alert>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <AlertDescription>
                      Checking availability for your selected dates...
                    </AlertDescription>
                  </Alert>
                )}

                {availabilityStatus === 'available' && availabilityChecked && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Great! This room is available for your selected dates.
                    </AlertDescription>
                  </Alert>
                )}

                {availabilityStatus === 'unavailable' && availabilityChecked && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Sorry, this room is not available for your selected dates. Please try different dates.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Continue Button */}
                {canProceedToGuests && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep('guests')}
                      size="lg"
                    >
                      Enter Guest Information
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="guests" className="space-y-6">
                <GuestInformationForm
                  adults={adults}
                  children={children}
                  onGuestInfoComplete={(info) => {
                    setGuestInfo(info)
                    setCurrentStep('summary')
                  }}
                />
              </TabsContent>

              <TabsContent value="summary" className="space-y-6">
                <div className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Booking Review</h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Hotel</h3>
                      <p className="text-gray-600">{hotelDetails.hotel.name}</p>
                      <p className="text-sm text-gray-500">
                        {hotelDetails.hotel.address.street}, {hotelDetails.hotel.address.city}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900">Room</h3>
                      <p className="text-gray-600">{selectedRoomOffer.roomType.name}</p>
                      <p className="text-sm text-gray-500">{selectedRoomOffer.roomType.description}</p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900">Dates</h3>
                      <p className="text-gray-600">
                        {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900">Guests</h3>
                      <p className="text-gray-600">
                        {adults} adult{adults !== 1 ? 's' : ''}
                        {children.length > 0 && `, ${children.length} child${children.length !== 1 ? 'ren' : ''}`}
                      </p>
                      {guestInfo && (
                        <p className="text-sm text-gray-500 mt-1">
                          Primary guest: {guestInfo.adults[0]?.firstName} {guestInfo.adults[0]?.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600 mb-4">
                      By proceeding, you agree to our terms and conditions and privacy policy.
                    </p>
                    <Button
                      onClick={handleProceedToPayment}
                      disabled={prebookMutation.isPending}
                      size="lg"
                      className="w-full"
                    >
                      {prebookMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Confirm & Pay'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Summary Sidebar */}
          <div>
            <BookingSummary
              hotel={hotelDetails.hotel}
              roomOffer={selectedRoomOffer}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={{ adults, children }}
              onProceedToPayment={currentStep === 'summary' ? handleProceedToPayment : undefined}
              isLoading={prebookMutation.isPending}
              showPaymentButton={currentStep === 'summary'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage