import React, { useState } from 'react'
import { X, Star, Wifi, Car, Dumbbell, Coffee, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import type { SearchFilters, HotelSearchResponse, MealPlan } from '@/types/liteapi'

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  searchResults?: HotelSearchResponse
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  searchResults
}) => {
  // Calculate price range from search results
  const priceRange = React.useMemo(() => {
    if (!searchResults?.hotels.length) return { min: 0, max: 1000 }

    const prices = searchResults.hotels.flatMap(hotel =>
      hotel.offers.map(offer => offer.pricing.totalPrice)
    )

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    }
  }, [searchResults])

  // Get unique amenities from search results
  const availableAmenities = React.useMemo(() => {
    if (!searchResults?.hotels.length) return []

    const amenityMap = new Map()

    searchResults.hotels.forEach(hotel => {
      hotel.amenities.forEach(amenity => {
        if (!amenityMap.has(amenity.id)) {
          amenityMap.set(amenity.id, {
            ...amenity,
            count: 0
          })
        }
        amenityMap.get(amenity.id).count++
      })
    })

    return Array.from(amenityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Show top 10 amenities
  }, [searchResults])

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...newFilters })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-4 h-4" />,
    parking: <Car className="w-4 h-4" />,
    fitness: <Dumbbell className="w-4 h-4" />,
    restaurant: <Coffee className="w-4 h-4" />,
  }

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="px-2">
            <Slider
              value={[
                filters.priceRange?.min ?? priceRange.min,
                filters.priceRange?.max ?? priceRange.max
              ]}
              min={priceRange.min}
              max={priceRange.max}
              step={10}
              onValueChange={(value) => {
                updateFilters({
                  priceRange: {
                    min: value[0],
                    max: value[1]
                  }
                })
              }}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>${filters.priceRange?.min ?? priceRange.min}</span>
            <span>${filters.priceRange?.max ?? priceRange.max}</span>
          </div>
        </CardContent>
      </Card>

      {/* Star Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Star Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center space-x-2">
              <Checkbox
                id={`stars-${stars}`}
                checked={filters.starRating?.includes(stars) ?? false}
                onCheckedChange={(checked) => {
                  const currentStars = filters.starRating ?? []
                  if (checked) {
                    updateFilters({
                      starRating: [...currentStars, stars]
                    })
                  } else {
                    updateFilters({
                      starRating: currentStars.filter(s => s !== stars)
                    })
                  }
                }}
              />
              <Label htmlFor={`stars-${stars}`} className="flex items-center gap-1 cursor-pointer">
                {Array.from({ length: stars }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                {stars < 5 && Array.from({ length: 5 - stars }, (_, i) => (
                  <Star key={i + stars} className="w-4 h-4 text-gray-300" />
                ))}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Guest Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Guest Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: 9, label: 'Excellent: 9+' },
            { value: 8, label: 'Very Good: 8+' },
            { value: 7, label: 'Good: 7+' },
            { value: 6, label: 'Pleasant: 6+' },
          ].map((rating) => (
            <div key={rating.value} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating.value}`}
                checked={filters.guestRating === rating.value}
                onCheckedChange={(checked) => {
                  updateFilters({
                    guestRating: checked ? rating.value : undefined
                  })
                }}
              />
              <Label htmlFor={`rating-${rating.value}`} className="cursor-pointer">
                {rating.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Meal Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meal Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: 'room_only' as MealPlan, label: 'Room Only' },
            { value: 'breakfast' as MealPlan, label: 'Breakfast Included' },
            { value: 'half_board' as MealPlan, label: 'Half Board' },
            { value: 'full_board' as MealPlan, label: 'Full Board' },
            { value: 'all_inclusive' as MealPlan, label: 'All Inclusive' },
          ].map((plan) => (
            <div key={plan.value} className="flex items-center space-x-2">
              <Checkbox
                id={`meal-${plan.value}`}
                checked={filters.mealPlan?.includes(plan.value) ?? false}
                onCheckedChange={(checked) => {
                  const currentPlans = filters.mealPlan ?? []
                  if (checked) {
                    updateFilters({
                      mealPlan: [...currentPlans, plan.value]
                    })
                  } else {
                    updateFilters({
                      mealPlan: currentPlans.filter(p => p !== plan.value)
                    })
                  }
                }}
              />
              <Label htmlFor={`meal-${plan.value}`} className="cursor-pointer">
                {plan.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: 'pay_now' as const, label: 'Pay Now', color: 'text-green-600' },
            { value: 'pay_later' as const, label: 'Pay at Hotel', color: 'text-orange-600' },
          ].map((payment) => (
            <div key={payment.value} className="flex items-center space-x-2">
              <Checkbox
                id={`payment-${payment.value}`}
                checked={filters.paymentType?.includes(payment.value) ?? false}
                onCheckedChange={(checked) => {
                  const currentTypes = filters.paymentType ?? []
                  if (checked) {
                    updateFilters({
                      paymentType: [...currentTypes, payment.value]
                    })
                  } else {
                    updateFilters({
                      paymentType: currentTypes.filter(p => p !== payment.value)
                    })
                  }
                }}
              />
              <Label htmlFor={`payment-${payment.value}`} className={`cursor-pointer ${payment.color}`}>
                {payment.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cancellation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: 'free' as const, label: 'Free Cancellation', color: 'text-green-600' },
            { value: 'partial' as const, label: 'Partial Refund', color: 'text-orange-600' },
            { value: 'non_refundable' as const, label: 'Non-refundable', color: 'text-red-600' },
          ].map((policy) => (
            <div key={policy.value} className="flex items-center space-x-2">
              <Checkbox
                id={`cancel-${policy.value}`}
                checked={filters.cancellationPolicy?.includes(policy.value) ?? false}
                onCheckedChange={(checked) => {
                  const currentPolicies = filters.cancellationPolicy ?? []
                  if (checked) {
                    updateFilters({
                      cancellationPolicy: [...currentPolicies, policy.value]
                    })
                  } else {
                    updateFilters({
                      cancellationPolicy: currentPolicies.filter(p => p !== policy.value)
                    })
                  }
                }}
              />
              <Label htmlFor={`cancel-${policy.value}`} className={`cursor-pointer ${policy.color}`}>
                {policy.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Amenities */}
      {availableAmenities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableAmenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={filters.amenities?.includes(amenity.id) ?? false}
                  onCheckedChange={(checked) => {
                    const currentAmenities = filters.amenities ?? []
                    if (checked) {
                      updateFilters({
                        amenities: [...currentAmenities, amenity.id]
                      })
                    } else {
                      updateFilters({
                        amenities: currentAmenities.filter(a => a !== amenity.id)
                      })
                    }
                  }}
                />
                <Label htmlFor={`amenity-${amenity.id}`} className="cursor-pointer flex items-center gap-2">
                  {amenityIcons[amenity.category] || <Check className="w-4 h-4" />}
                  <span>{amenity.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {amenity.count}
                  </Badge>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filters.priceRange && (
                <Badge variant="secondary" className="gap-1">
                  ${filters.priceRange.min} - ${filters.priceRange.max}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => updateFilters({ priceRange: undefined })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.starRating?.map(stars => (
                <Badge key={stars} variant="secondary" className="gap-1">
                  {stars} Star{stars !== 1 ? 's' : ''}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => {
                      const updated = filters.starRating?.filter(s => s !== stars)
                      updateFilters({ starRating: updated?.length ? updated : undefined })
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {filters.guestRating && (
                <Badge variant="secondary" className="gap-1">
                  {filters.guestRating}+ Rating
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => updateFilters({ guestRating: undefined })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SearchFilters