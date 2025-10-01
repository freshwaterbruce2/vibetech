// Security utilities following 2025 best practices

// XSS Protection
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;')
}

// URL validation to prevent javascript: and other unsafe protocols
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    return allowedProtocols.includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

// Sanitize URL for safe rendering
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  // Remove javascript: and other unsafe protocols
  const unsafePattern = /^(javascript|data|vbscript|onload|onerror):/i
  if (unsafePattern.test(url)) {
    return '#'
  }

  // Ensure URL is properly formatted
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return `https://${url}`
  }

  return url
}

// Content Security Policy helpers
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Rate limiting utilities
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || []

    // Filter out requests outside the current window
    const validRequests = existingRequests.filter(timestamp => timestamp > windowStart)

    // Check if under the limit
    if (validRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return true
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

export const rateLimiter = new RateLimiter()

// CSRF Token management
export class CSRFToken {
  private static readonly TOKEN_HEADER = 'X-CSRF-Token'
  private static readonly TOKEN_KEY = 'csrf_token'

  static generate(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    sessionStorage.setItem(this.TOKEN_KEY, token)
    return token
  }

  static get(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY)
  }

  static getHeader(): Record<string, string> {
    const token = this.get()
    return token ? { [this.TOKEN_HEADER]: token } : {}
  }

  static validate(token: string): boolean {
    const storedToken = this.get()
    return storedToken !== null && storedToken === token
  }

  static clear(): void {
    sessionStorage.removeItem(this.TOKEN_KEY)
  }
}

// Input validation for preventing injection attacks
export function validateInput(input: string, maxLength: number = 1000): {
  isValid: boolean
  sanitized: string
  errors: string[]
} {
  const errors: string[] = []
  let sanitized = input.trim()

  // Check length
  if (sanitized.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`)
    sanitized = sanitized.slice(0, maxLength)
  }

  // Check for potential SQL injection patterns
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(-{2,})|(\*\/)|(\*)|(\bOR\b.*=)|(\bAND\b.*=)/i
  if (sqlInjectionPattern.test(sanitized)) {
    errors.push('Input contains potentially harmful content')
  }

  // Check for XSS patterns
  const xssPattern = /<script|javascript:|onload=|onerror=|<iframe|<object|<embed/i
  if (xssPattern.test(sanitized)) {
    errors.push('Input contains potentially harmful scripts')
    sanitized = escapeHtml(sanitized)
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  }
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score++
  else feedback.push('Use at least 8 characters')

  if (password.length >= 12) score++
  else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security')

  // Character variety checks
  if (/[a-z]/.test(password)) score++
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Include uppercase letters')

  if (/\d/.test(password)) score++
  else feedback.push('Include numbers')

  if (/[^A-Za-z\d]/.test(password)) score++
  else feedback.push('Include special characters')

  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{2,}/ // Repeated characters
  ]

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid common patterns and repeated characters')
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, score - 2))

  return {
    score,
    feedback,
    isStrong: score >= 3
  }
}

// Secure random string generation
export function generateSecureRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  return Array.from(array, byte => charset[byte % charset.length]).join('')
}

// Timing attack prevention
export function constantTimeStringCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// Session security helpers
export class SessionSecurity {
  private static readonly SESSION_KEY = 'session_data'
  private static readonly FINGERPRINT_KEY = 'browser_fingerprint'

  static generateFingerprint(): string {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.cookieEnabled,
      navigator.doNotTrack
    ].join('|')

    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return hash.toString(36)
  }

  static initializeSession(): void {
    const fingerprint = this.generateFingerprint()
    sessionStorage.setItem(this.FINGERPRINT_KEY, fingerprint)
  }

  static validateSession(): boolean {
    const storedFingerprint = sessionStorage.getItem(this.FINGERPRINT_KEY)
    const currentFingerprint = this.generateFingerprint()

    return storedFingerprint === currentFingerprint
  }

  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY)
    sessionStorage.removeItem(this.FINGERPRINT_KEY)
    localStorage.clear() // Clear all auth tokens
  }
}

// Initialize session security
SessionSecurity.initializeSession()

// Export additional utilities
export {
  RateLimiter
}