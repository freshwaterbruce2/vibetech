import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Hotel,
  Calendar,
  Users,
  Clock,
  Shield,
  Info,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import type { Hotel as HotelType, RoomOffer } from '@/types/liteapi'
import type { HotelPaymentData, GuestInfo } from '@/types/payment.types'

interface PaymentSummaryProps {
  hotel: HotelType
  roomOffer: RoomOffer
  checkIn: Date
  checkOut: Date
  guestInfo: GuestInfo
  paymentData: HotelPaymentData
  className?: string
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  hotel,
  roomOffer,
  checkIn,
  checkOut,
  guestInfo,
  paymentData,
  className
}) => {
  const nights = differenceInDays(checkOut, checkIn)
  const totalGuests = guestInfo.adults.length + guestInfo.children.length

  // Format amount from cents to dollars
  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hotel Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold">{hotel.name}</h3>
          </div>
          <p className="text-sm text-gray-600">
            {hotel.address.street}, {hotel.address.city}, {hotel.address.country}
          </p>
          <div className="flex items-center gap-1">
            {[...Array(hotel.starRating)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-yellow-400 rounded-sm" />
            ))}
          </div>
        </div>

        <Separator />

        {/* Room Details */}
        <div className="space-y-3">
          <h4 className="font-medium">Room Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{roomOffer.roomType.name}</p>
                <p className="text-xs text-gray-600">{roomOffer.roomType.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {roomOffer.ratePlan.mealPlan.replace('_', ' ')}
              </Badge>
              <Badge
                variant={roomOffer.ratePlan.refundable ? "default" : "secondary"}
                className="text-xs"
              >
                {roomOffer.ratePlan.refundable ? 'Refundable' : 'Non-refundable'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Max {roomOffer.roomType.maxOccupancy} guests
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stay Details */}
        <div className="space-y-3">
          <h4 className="font-medium">Stay Details</h4>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd, yyyy')}
              </span>
              <span className="text-gray-600">
                ({nights} night{nights !== 1 ? 's' : ''})
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
              <span className="text-gray-600">
                ({guestInfo.adults.length} adult{guestInfo.adults.length !== 1 ? 's' : ''}
                {guestInfo.children.length > 0 && `, ${guestInfo.children.length} child${guestInfo.children.length !== 1 ? 'ren' : ''}`})
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Check-in: 3:00 PM, Check-out: 11:00 AM
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Guest Information */}
        <div className="space-y-3">
          <h4 className="font-medium">Primary Guest</h4>
          <div className="text-sm">
            <p className="font-medium">
              {guestInfo.adults[0]?.firstName} {guestInfo.adults[0]?.lastName}
            </p>
            {guestInfo.adults[0]?.email && (
              <p className="text-gray-600">{guestInfo.adults[0].email}</p>
            )}
            {guestInfo.adults[0]?.phone && (
              <p className="text-gray-600">{guestInfo.adults[0].phone}</p>
            )}
          </div>

          {guestInfo.specialRequests && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700">Special Requests:</p>
              <p className="text-xs text-gray-600 mt-1">{guestInfo.specialRequests}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium">Price Breakdown</h4>

          <div className="space-y-2">
            {paymentData.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className={item.type === 'deposit' ? 'text-orange-600' : 'text-gray-600'}>
                  {item.description}
                </span>
                <span className="font-medium">
                  ${formatAmount(item.amount)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total Authorization</span>
            <span>${formatAmount(paymentData.totalAmount)}</span>
          </div>

          <div className="text-xs text-gray-600">
            *Security deposit will be refunded after checkout if no damages occur
          </div>
        </div>

        <Separator />

        {/* Payment & Cancellation Policies */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium text-sm text-green-700">Payment Authorization</span>
            </div>
            <p className="text-xs text-gray-600">
              We'll authorize this amount on your card now but won't charge you until check-in.
              The authorization will automatically expire if not captured within 7 days.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-700">Cancellation Policy</span>
            </div>
            <p className="text-xs text-gray-600">
              {roomOffer.policies.cancellation.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">What's Included</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Room accommodation for {nights} night{nights !== 1 ? 's' : ''}</li>
              <li>• {roomOffer.ratePlan.mealPlan.replace('_', ' ')}</li>
              {roomOffer.amenities && roomOffer.amenities.length > 0 && (
                <>
                  {roomOffer.amenities.slice(0, 3).map((amenity, idx) => (
                    <li key={idx}>• {amenity.name}</li>
                  ))}
                  {roomOffer.amenities.length > 3 && (
                    <li>• And {roomOffer.amenities.length - 3} more amenities</li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800">Important Information</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• You won't be charged until check-in</li>
                <li>• Bring a valid ID matching the booking name</li>
                <li>• Contact the hotel directly for special arrangements</li>
                <li>• Check hotel policies for pet-friendly accommodations</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PaymentSummary