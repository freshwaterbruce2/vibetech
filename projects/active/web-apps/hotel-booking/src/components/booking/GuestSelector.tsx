import React, { useState } from 'react'
import { Users, Plus, Minus, Baby } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface GuestSelectorProps {
  adults: number
  children: number[]
  onGuestChange: (adults: number, children: number[]) => void
  maxGuests?: number
  maxChildren?: number
  className?: string
}

const GuestSelector: React.FC<GuestSelectorProps> = ({
  adults,
  children,
  onGuestChange,
  maxGuests = 8,
  maxChildren = 4,
  className
}) => {
  const [childrenAges, setChildrenAges] = useState<number[]>(children)

  const totalGuests = adults + childrenAges.length

  const updateAdults = (newAdults: number) => {
    if (newAdults >= 1 && newAdults + childrenAges.length <= maxGuests) {
      onGuestChange(newAdults, childrenAges)
    }
  }

  const updateChildren = (newChildrenAges: number[]) => {
    if (newChildrenAges.length <= maxChildren && adults + newChildrenAges.length <= maxGuests) {
      setChildrenAges(newChildrenAges)
      onGuestChange(adults, newChildrenAges)
    }
  }

  const addChild = () => {
    if (childrenAges.length < maxChildren && totalGuests < maxGuests) {
      updateChildren([...childrenAges, 5]) // Default age 5
    }
  }

  const removeChild = (index: number) => {
    const newChildren = childrenAges.filter((_, i) => i !== index)
    updateChildren(newChildren)
  }

  const updateChildAge = (index: number, age: number) => {
    if (age >= 0 && age <= 17) {
      const newChildren = [...childrenAges]
      newChildren[index] = age
      updateChildren(newChildren)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Guests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adults */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Adults</Label>
            <p className="text-sm text-gray-600">Ages 18+</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateAdults(adults - 1)}
              disabled={adults <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-medium">{adults}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateAdults(adults + 1)}
              disabled={totalGuests >= maxGuests}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Children */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-base font-medium">Children</Label>
              <p className="text-sm text-gray-600">Ages 0-17</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => childrenAges.length > 0 && removeChild(childrenAges.length - 1)}
                disabled={childrenAges.length === 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-medium">{childrenAges.length}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={addChild}
                disabled={childrenAges.length >= maxChildren || totalGuests >= maxGuests}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Child Age Selectors */}
          {childrenAges.map((age, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Child {index + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`child-age-${index}`} className="text-sm">Age:</Label>
                <select
                  id={`child-age-${index}`}
                  value={age}
                  onChange={(e) => updateChildAge(index, parseInt(e.target.value))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Array.from({ length: 18 }, (_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChild(index)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-900">
            Total: {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
          </div>
          <div className="text-sm text-gray-600">
            {adults} adult{adults !== 1 ? 's' : ''}
            {childrenAges.length > 0 && `, ${childrenAges.length} child${childrenAges.length !== 1 ? 'ren' : ''}`}
          </div>
          {childrenAges.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Child ages: {childrenAges.join(', ')}
            </div>
          )}
        </div>

        {/* Limits Info */}
        <div className="text-xs text-gray-500">
          Maximum {maxGuests} guests per room • Maximum {maxChildren} children
        </div>
      </CardContent>
    </Card>
  )
}

export default GuestSelector