import { z } from 'zod'

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]{10,}$/, 'Please enter a valid phone number')
  .optional()

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

// Hotel search schema
export const searchSchema = z.object({
  location: z.string().min(1, 'Destination is required'),
  checkIn: z.date().refine(date => date >= new Date(), 'Check-in date must be in the future'),
  checkOut: z.date(),
  guests: z.object({
    adults: z.number().min(1, 'At least 1 adult is required').max(10, 'Maximum 10 adults allowed'),
    children: z.number().min(0, 'Children count cannot be negative').max(8, 'Maximum 8 children allowed'),
    rooms: z.number().min(1, 'At least 1 room is required').max(5, 'Maximum 5 rooms allowed')
  })
}).refine(data => data.checkOut > data.checkIn, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut']
})

// Booking guest details schema
export const guestDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: emailSchema,
  phone: z.string().min(1, 'Phone number is required'),
  specialRequests: z.string().max(500, 'Special requests must be less than 500 characters').optional()
})

// Payment information schema
export const paymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expiryMonth: z.number().min(1).max(12),
  expiryYear: z.number().min(new Date().getFullYear()),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  cardholderName: z.string().min(1, 'Cardholder name is required').max(100),
  billingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  })
})

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  preferences: z.object({
    currency: z.string().min(3).max(3),
    language: z.string().min(2).max(5),
    newsletter: z.boolean(),
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean()
    })
  })
})

// Review schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(1, 'Review title is required').max(100, 'Title must be less than 100 characters'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review must be less than 1000 characters'),
  pros: z.array(z.string()).max(5, 'Maximum 5 pros allowed').optional(),
  cons: z.array(z.string()).max(5, 'Maximum 5 cons allowed').optional(),
  roomType: z.string().min(1, 'Room type is required'),
  travelType: z.enum(['business', 'leisure', 'family', 'couple', 'solo'])
})

// Input sanitization functions
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000) // Limit length
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Credit card validation
export function validateCreditCard(number: string): {
  isValid: boolean
  type: string | null
} {
  // Remove spaces and non-digits
  const cleaned = number.replace(/\D/g, '')

  // Check length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false, type: null }
  }

  // Luhn algorithm
  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  const isValid = sum % 10 === 0

  // Determine card type
  let type: string | null = null
  if (isValid) {
    if (cleaned.match(/^4/)) type = 'Visa'
    else if (cleaned.match(/^5[1-5]/)) type = 'Mastercard'
    else if (cleaned.match(/^3[47]/)) type = 'American Express'
    else if (cleaned.match(/^6/)) type = 'Discover'
  }

  return { isValid, type }
}

// Email validation with domain checking
export function validateEmail(email: string): {
  isValid: boolean
  suggestion?: string
} {
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
  const result = emailSchema.safeParse(email)

  if (!result.success) {
    return { isValid: false }
  }

  const domain = email.split('@')[1]
  const suggestion = commonDomains.find(d =>
    d.includes(domain) || domain.includes(d.split('.')[0])
  )

  return {
    isValid: true,
    suggestion: suggestion && suggestion !== domain ? suggestion : undefined
  }
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  return phone
}

// Date validation helpers
export function isValidDateRange(startDate: Date, endDate: Date, minDays: number = 1): boolean {
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= minDays
}

export function isDateInFuture(date: Date, minDaysFromNow: number = 0): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(today.getTime() + (minDaysFromNow * 24 * 60 * 60 * 1000))
  return date >= targetDate
}

// Export schema types for TypeScript
export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type GuestDetailsFormData = z.infer<typeof guestDetailsSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type ReviewFormData = z.infer<typeof reviewSchema>