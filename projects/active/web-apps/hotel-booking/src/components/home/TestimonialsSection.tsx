import React from 'react'
import { Star, Quote } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'San Francisco, CA',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b04c?q=80&w=150&auto=format',
      rating: 5,
      text: 'Absolutely amazing experience! The booking process was seamless and the hotel recommendations were spot on. Will definitely use Vibe Bookings again.',
    },
    {
      name: 'Michael Chen',
      location: 'New York, NY',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format',
      rating: 5,
      text: 'Found the perfect hotel for our anniversary trip. The customer service was exceptional and helped us find a great deal. Highly recommended!',
    },
    {
      name: 'Emily Rodriguez',
      location: 'Miami, FL',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format',
      rating: 5,
      text: 'Love how easy it is to filter and find exactly what I\'m looking for. The price comparison feature saved me hundreds on my last business trip.',
    },
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl  font-bold text-gray-900 mb-4">
          What Our Travelers Say
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Join millions of satisfied customers who trust Vibe Bookings for their travel needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-vibe-blue-200 mr-2" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>

              <div className="flex items-center">
                <Avatar className="w-12 h-12 mr-4">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSection