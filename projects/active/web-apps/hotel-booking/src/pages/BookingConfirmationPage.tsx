import React from 'react'
import { useParams } from 'react-router-dom'

const BookingConfirmationPage = () => {
  const { bookingId } = useParams()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Booking Confirmation</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Confirmation details for booking: {bookingId}</p>
          <p className="text-sm text-gray-500 mt-2">This page is currently under development.</p>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage