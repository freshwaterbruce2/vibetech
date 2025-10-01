import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Users, Phone, Mail, Calendar, Globe, AlertCircle } from 'lucide-react'

const guestSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Please enter a valid phone number').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
})

const guestInfoSchema = z.object({
  adults: z.array(guestSchema),
  children: z.array(guestSchema),
  specialRequests: z.string().optional(),
})

type GuestInfo = z.infer<typeof guestInfoSchema>

interface GuestInformationFormProps {
  adults: number
  children: number[]
  onGuestInfoComplete: (guestInfo: GuestInfo) => void
  className?: string
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  // Add more countries as needed
]

const GuestInformationForm: React.FC<GuestInformationFormProps> = ({
  adults,
  children,
  onGuestInfoComplete,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<'adults' | 'children' | 'requests'>('adults')

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<GuestInfo>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      adults: Array(adults).fill(null).map(() => ({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
      })),
      children: children.map((age, index) => ({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: new Date(Date.now() - age * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nationality: '',
      })),
      specialRequests: '',
    },
    mode: 'onChange'
  })

  const { fields: adultFields } = useFieldArray({
    control,
    name: 'adults',
  })

  const { fields: childFields } = useFieldArray({
    control,
    name: 'children',
  })

  const watchedForm = watch()

  const onSubmit = (data: GuestInfo) => {
    onGuestInfoComplete(data)
  }

  const canProceedToChildren = adultFields.every((_, index) => {
    const adult = watchedForm.adults[index]
    return adult?.firstName && adult?.lastName
  })

  const canProceedToRequests = canProceedToChildren && childFields.every((_, index) => {
    const child = watchedForm.children[index]
    return child?.firstName && child?.lastName
  })

  const getStepContent = () => {
    switch (currentStep) {
      case 'adults':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Adult Guest Information</h3>
            </div>

            {adultFields.map((field, index) => (
              <Card key={field.id} className="border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    {index === 0 ? 'Primary Guest (Main Contact)' : `Adult Guest ${index + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`adults.${index}.firstName`}>First Name *</Label>
                      <Input
                        {...register(`adults.${index}.firstName`)}
                        placeholder="Enter first name"
                        className="mt-1"
                      />
                      {errors.adults?.[index]?.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.adults[index]?.firstName?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`adults.${index}.lastName`}>Last Name *</Label>
                      <Input
                        {...register(`adults.${index}.lastName`)}
                        placeholder="Enter last name"
                        className="mt-1"
                      />
                      {errors.adults?.[index]?.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.adults[index]?.lastName?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`adults.${index}.email`}>
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email Address *
                        </Label>
                        <Input
                          {...register(`adults.${index}.email`)}
                          type="email"
                          placeholder="Enter email address"
                          className="mt-1"
                        />
                        {errors.adults?.[index]?.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.adults[index]?.email?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`adults.${index}.phone`}>
                          <Phone className="w-4 h-4 inline mr-1" />
                          Phone Number *
                        </Label>
                        <Input
                          {...register(`adults.${index}.phone`)}
                          type="tel"
                          placeholder="Enter phone number"
                          className="mt-1"
                        />
                        {errors.adults?.[index]?.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.adults[index]?.phone?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`adults.${index}.dateOfBirth`}>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date of Birth
                      </Label>
                      <Input
                        {...register(`adults.${index}.dateOfBirth`)}
                        type="date"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`adults.${index}.nationality`}>
                        <Globe className="w-4 h-4 inline mr-1" />
                        Nationality
                      </Label>
                      <Select onValueChange={(value) => setValue(`adults.${index}.nationality`, value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep('children')}
                disabled={!canProceedToChildren}
                size="lg"
              >
                {children.length > 0 ? 'Continue to Children' : 'Continue'}
              </Button>
            </div>
          </div>
        )

      case 'children':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Children Information</h3>
            </div>

            {childFields.map((field, index) => (
              <Card key={field.id} className="border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Child {index + 1} (Age: {children[index]})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`children.${index}.firstName`}>First Name *</Label>
                      <Input
                        {...register(`children.${index}.firstName`)}
                        placeholder="Enter child's first name"
                        className="mt-1"
                      />
                      {errors.children?.[index]?.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.children[index]?.firstName?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`children.${index}.lastName`}>Last Name *</Label>
                      <Input
                        {...register(`children.${index}.lastName`)}
                        placeholder="Enter child's last name"
                        className="mt-1"
                      />
                      {errors.children?.[index]?.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.children[index]?.lastName?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`children.${index}.dateOfBirth`}>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date of Birth
                      </Label>
                      <Input
                        {...register(`children.${index}.dateOfBirth`)}
                        type="date"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`children.${index}.nationality`}>
                        <Globe className="w-4 h-4 inline mr-1" />
                        Nationality
                      </Label>
                      <Select onValueChange={(value) => setValue(`children.${index}.nationality`, value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('adults')}
              >
                Back to Adults
              </Button>
              <Button
                onClick={() => setCurrentStep('requests')}
                disabled={!canProceedToRequests}
                size="lg"
              >
                Continue to Special Requests
              </Button>
            </div>
          </div>
        )

      case 'requests':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Special Requests (Optional)</h3>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Label htmlFor="specialRequests">Special Requests or Notes</Label>
                <textarea
                  {...register('specialRequests')}
                  placeholder="Enter any special requests, dietary requirements, accessibility needs, or other notes for the hotel..."
                  className="mt-2 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Note: Special requests are subject to availability and may incur additional charges.
                </p>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Please review all guest information carefully. This information must match the identification
                documents you'll present at check-in.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(children.length > 0 ? 'children' : 'adults')}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={!isValid}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Complete Guest Information
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Guest Information</CardTitle>
        <div className="flex space-x-2">
          <div className={`h-2 flex-1 rounded ${currentStep === 'adults' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded ${currentStep === 'children' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded ${currentStep === 'requests' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
      </CardHeader>
      <CardContent>
        {getStepContent()}
      </CardContent>
    </Card>
  )
}

export default GuestInformationForm