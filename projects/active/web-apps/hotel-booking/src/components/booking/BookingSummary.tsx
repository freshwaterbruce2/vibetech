import React from 'react'
import { Calendar, Users, Clock, CreditCard, Shield, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Hotel, RoomOffer } from '@/types/liteapi'
import { format, differenceInDays } from 'date-fns'

interface BookingSummaryProps {
  hotel: Hotel
  roomOffer: RoomOffer
  checkIn: Date
  checkOut: Date
  guests: {
    adults: number
    children: number[]
  }
  onProceedToPayment?: () => void
  isLoading?: boolean
  showPaymentButton?: boolean
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  hotel,
  roomOffer,
  checkIn,
  checkOut,
  guests,
  onProceedToPayment,
  isLoading = false,
  showPaymentButton = true
}) => {
  const nights = differenceInDays(checkOut, checkIn)
  const totalGuests = guests.adults + guests.children.length
  const baseTotal = roomOffer.pricing.basePrice * nights
  const totalPrice = roomOffer.pricing.totalPrice * nights

  const taxes = roomOffer.pricing.taxes.reduce((sum, tax) => sum + tax.amount, 0) * nights
  const fees = roomOffer.pricing.fees.reduce((sum, fee) => sum + fee.amount, 0) * nights

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hotel Info */}
        <div>
          <h3 className="font-semibold text-lg mb-1">{hotel.name}</h3>
          <p className="text-gray-600 text-sm">{hotel.address.city}, {hotel.address.country}</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(hotel.starRating)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-yellow-400 rounded-sm" />
            ))}
          </div>
        </div>

        <Separator />

        {/* Room Info */}
        <div>
          <h4 className="font-medium mb-2">{roomOffer.roomType.name}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Max {roomOffer.roomType.maxOccupancy} guests</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">{roomOffer.ratePlan.mealPlan.replace('_', ' ')}</Badge>
              <Badge variant={roomOffer.ratePlan.refundable ? "default" : "secondary"}>
                {roomOffer.ratePlan.refundable ? 'Refundable' : 'Non-refundable'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stay Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div className="text-sm">
              <div className="font-medium">{format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd, yyyy')}</div>
              <div className="text-gray-600">{nights} night{nights !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="text-sm">
              <div className="font-medium">{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</div>
              <div className="text-gray-600">
                {guests.adults} adult{guests.adults !== 1 ? 's' : ''}
                {guests.children.length > 0 && `, ${guests.children.length} child${guests.children.length !== 1 ? 'ren' : ''}`}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium">Price breakdown</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>${roomOffer.pricing.basePrice} × {nights} nights</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>

            {roomOffer.pricing.taxes.map((tax, index) => (
              <div key={index} className="flex justify-between text-gray-600">
                <span>{tax.name}</span>
                <span>${(tax.amount * nights).toFixed(2)}</span>
              </div>
            ))}

            {roomOffer.pricing.fees.map((fee, index) => (
              <div key={index} className="flex justify-between text-gray-600">
                <span>{fee.name}</span>
                <span>${(fee.amount * nights).toFixed(2)}</span>
              </div>
            ))}

            {roomOffer.pricing.discounts?.map((discount, index) => (
              <div key={index} className="flex justify-between text-green-600">
                <span>{discount.description}</span>
                <span>-${(discount.amount * nights).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <div className="text-xs text-gray-600">
            Includes all taxes and fees
          </div>
        </div>

        <Separator />

        {/* Cancellation Policy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm">Cancellation</span>
          </div>
          <p className="text-xs text-gray-600">
            {roomOffer.policies.cancellation.description}
          </p>
        </div>

        <Separator />

        {/* Payment Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm">Payment</span>
          </div>
          <p className="text-xs text-gray-600">
            {roomOffer.ratePlan.paymentType === 'pay_now'
              ? 'Payment required now'
              : 'Payment at property'}
          </p>
        </div>

        {/* Availability Warning */}
        {roomOffer.availability.roomsLeft && roomOffer.availability.roomsLeft <= 5 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Only {roomOffer.availability.roomsLeft} rooms left!
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {showPaymentButton && onProceedToPayment && (
          <>
            <Button
              onClick={onProceedToPayment}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              You won't be charged yet
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default BookingSummary